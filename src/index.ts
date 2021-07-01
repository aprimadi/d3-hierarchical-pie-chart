export interface NodeType {
  name: string,
  description: string,
  value: number,
  children?: Array<NodeType>,
}
interface ArcDatum extends NodeType {
  startAngle: number,
  stopAngle: number,
  level: number,
}

/**
 * General constructs to store navigation history.
 *
 * It's implemented as a stack.
 */
class NavigationHistory {
  history: Array<any>

  constructor(history: Array<any>) {
    this.history = history
  }

  navigate(t: any) {
    this.history.push(t)
  }

  back() {
    if (this.history.length > 0) {
      this.history.pop()
    }
  }

  /**
   * Return the current navigation
   */
  current() {
    const len = this.history.length
    if (len > 0) {
      return this.history[len-1]
    } else {
      return undefined
    }
  }

  /**
   * Return the previous navigation
   */
  previous() {
    const len = this.history.length
    if (len > 1) {
      return this.history[len-2]
    } else {
      return undefined
    }
  }

  /**
   * Return the number of entries stored in the history.
   */
  size() {
    return this.history.length
  }
}

class HierarchicalPieChart {
  d3: any
  data: NodeType
  arcData: Array<ArcDatum>
  currentArc?: ArcDatum
  plotWidth: number
  plotHeight: number
  labelFn:  (d: NodeType) => string
  legendFn: (d: NodeType) => string
  legendPosition: 'top' | 'bottom'
  colorFn:  (d: NodeType) => string
  animating: boolean
  // Stores arc-click navigation (history of which arc are being selected).
  arcClickHistory: NavigationHistory

  constructor(
    d3: any, 
    data: any, 
    options: {
      plotWidth?: number,
      plotHeight?: number,
      labelFn?: (d: NodeType) => string, 
      legendFn?: (d: NodeType) => string,
      legendPosition?: 'top' | 'bottom',
      colorFn?: (d: NodeType) => string,
    } = {},
  ) {
    this.d3 = d3
    this.data = data
    this.labelFn = options.labelFn || function(d: NodeType) { return d.name + ": " + d.description }
    this.legendFn = options.legendFn || function(d: NodeType) {
      const name = d.name || "&nbsp;"
      const description = d.description || "&nbsp;"
      return "<h2>" + name + "</h2><p>" + description + "</p>"
    }
    const color = d3.scaleOrdinal(d3.schemeTableau10)
    this.colorFn = options.colorFn || function(d: NodeType) {
      return color(d.name)
    }
    this.plotWidth = options.plotWidth || 400
    this.plotHeight = options.plotHeight || this.plotWidth
    this.legendPosition = options.legendPosition || 'bottom'
    this.animating = false

    this.arcData = this.processData(this.data, 0, 0, 2 * Math.PI)
    this.arcClickHistory = new NavigationHistory([this.arcData[0]])
  }

  /**
   * Render hierarchical pie chart on a given element.
   */
  render(el: HTMLElement) {
    if (!el.querySelector(".chart-plot")) {
      const div = document.createElement('div')
      div.setAttribute('class', 'chart-plot')
      el.append(div)
    }
    if (!el.querySelector(".chart-legend")) {
      const div = document.createElement('div')
      div.setAttribute('class', 'chart-legend')
      div.innerHTML = this.legendFn(this.data)
      if (this.legendPosition == 'top') {
        el.prepend(div)
      } else {
        el.append(div)
      }
    }
    const plotEl = el.querySelector(".chart-plot")
    const legendEl = el.querySelector(".chart-legend")

    var width = this.plotWidth
    var height = this.plotHeight
    
    const maxLevel = this.maxLevel(this.data)

    var svg = this.d3.select(plotEl).selectAll("svg")
      .data([null])
      .join("svg")
        .attr("width", width)
        .attr("height", height)

    var group = svg.selectAll("g")
      .data([null])
      .join("g")
        .attr("transform", "translate(" + width / 2 + "," + height * .52 + ")")
          
    var thickness = width / 2.0 / (maxLevel + 2) * 1.1
        
    var arc = this.d3.arc()
      .startAngle((d: ArcDatum) => d.startAngle)
      .endAngle((d: ArcDatum) => d.stopAngle)
      .innerRadius((d: ArcDatum) => 1.1 * d.level * thickness)
      .outerRadius((d: ArcDatum) => (1.1 * d.level + 1) * thickness)

    var slices = group.selectAll("path")
      .data(this.arcData)
      .join("path")
        .attr("d", arc)
        .style("fill", (d: ArcDatum) => this.colorFn(d))

    this.d3on(slices, "click", this.onClickArc.bind(this, plotEl, arc))

    if (this.labelFn) {
      slices.append("svg:title").text(this.labelFn)
    }
    if (this.legendFn) {
      var legend = this.d3.select(legendEl)
      const updateLegend = (d: ArcDatum) => {
        legend.html(this.legendFn(d))
        legend.transition().duration(200).style("opacity","1")
      }
      const removeLegend = () => {
        legend.transition().duration(1000).style("opacity","0")
      }

      this.d3on(slices, "mouseover", updateLegend)
      this.d3on(slices, "mouseout", removeLegend)
    }
  }

  /**
   * Wrapper for `d3obj.on(evtName, fn)`
   */
  private d3on(d3obj: any, evtName: string, fn: Function) {
    const version = parseInt(this.d3.version.split('.')[0])
    if (version <= 5) {
      d3obj.on(evtName, fn)
    } else {
      d3obj.on(evtName, function(evt: any) {
        evt.stopPropagation()
        const args = Array.from(arguments).slice(1)
        fn(...args)
      })
    }
  }

  /**
   * Interpolates arc during animation.
   */
  private arcTween(arc: any, baseArc: ArcDatum, targetArc: ArcDatum) {
    // The function passed to arcTween is invoked for each selected element
    // when the transition starts, and for each element returns the 
    // interpolator to use over the course of transition.
    return (d: ArcDatum) => {
      var level = this.d3.interpolate(this.getLevel(d, baseArc), this.getLevel(d, targetArc))
      var startDeg = this.d3.interpolate(this.getStartAngle(d, baseArc), this.getStartAngle(d, targetArc))
      var stopDeg = this.d3.interpolate(this.getStopAngle(d, baseArc), this.getStopAngle(d, targetArc))
      
      // The argument t ranges from 0, at the start of the transition, to 1, 
      // at the end. It's used to control the animation.
      return function(t: number) {
        return arc({
          startAngle: startDeg(t),
          stopAngle: stopDeg(t),
          name: d.name,
          description: d.description,
          value: d.value,
          level: level(t),
        })
      }
    }
  }

  /**
   * Callback when an arc is clicked.
   *
   * The parameter arc is actually a function returned from calling `d3.arc()`.
   * We're using any because of a lack of d3 type annotations.
   */
  private onClickArc(plotEl: HTMLElement, arc: any, d: ArcDatum) {
    if (this.animating) {
      return
    }

    const svg = this.d3.select(plotEl)

    this.animating = true
    var revert = false
    let baseArc = this.arcClickHistory.current()
    let targetArc = d
    if (d == this.arcClickHistory.current() && this.arcClickHistory.size() > 1) {
      revert = true
      baseArc = this.arcClickHistory.current()
      targetArc = this.arcClickHistory.previous()
    }
    if (revert) {
      svg.selectAll("path")
        .filter(function (b: ArcDatum) {
          return (
            b.startAngle >= targetArc.startAngle && 
            b.stopAngle <= targetArc.stopAngle && 
            b.level >= targetArc.level
          )
        })
        .transition().duration(1000).style("opacity", "1").attr("pointer-events", "all")
    } else {
      svg.selectAll("path")
        .filter(function (b: ArcDatum) {
          return (
            b.startAngle < d.startAngle || b.stopAngle > d.stopAngle || 
            b.level < d.level
          )
        })
        .transition().duration(1000).style("opacity", "0").attr("pointer-events", "none")
    }
    svg.selectAll("path")
      .filter(function(b: ArcDatum) {
        return (
          b.startAngle >= d.startAngle && 
          b.stopAngle <= d.stopAngle && 
          b.level >= d.level
        )
      })
      .transition().duration(1000).attrTween("d", this.arcTween(arc, baseArc, targetArc))
    setTimeout(() => {
      this.animating = false
      if (!revert) {
        this.arcClickHistory.navigate(d)
      } else {
        this.arcClickHistory.back()
      }
    }, 1000)
  }

  /**
   * Get the depth of the `data` tree
   */
  private maxLevel(data: NodeType): number {
    let level = 0
    for (let child of data.children) {
      level = Math.max(this.maxLevel(child) + 1, level)
    }
    return level
  }

  private processData(
    data: NodeType, 
    level: number, 
    startAngle: number, 
    stopAngle: number, 
    result?: Array<ArcDatum>
  ): Array<ArcDatum> {
    result = result || []
    var total = data.value
    if (startAngle == stopAngle) {
      return
    }
    result.push({
      startAngle: startAngle,
      stopAngle: stopAngle,
      name: data.name,
      description: data.description,
      value: data.value,
      level: level,
    })
    let angle = startAngle
    for (var child of data.children) {
      var angleInc = (stopAngle - startAngle) / total * child.value
      var childStartAngle = angle 
      var childStopAngle = angle + angleInc
      this.processData(child, level+1, childStartAngle, childStopAngle, result)
      angle += angleInc
    }
    return result
  }

  private getStartAngle(d: ArcDatum, ref: ArcDatum) {
    var span = ref.stopAngle - ref.startAngle
    return (d.startAngle - ref.startAngle) / span * Math.PI * 2.0
  }

  private getStopAngle(d: ArcDatum, ref: ArcDatum) {
    var span = ref.stopAngle - ref.startAngle
    return (d.stopAngle - ref.startAngle) / span * Math.PI * 2.0
  }

  private getLevel(d: ArcDatum, ref: ArcDatum) {
    return d.level - ref.level
  }
}

export default HierarchicalPieChart

