d3-hierarchical-pie-chart
=========================

d3 library for rendering hierarchical pie chart.

## Usage

This library has no d3 dependencies, instead you have to install d3 
dependencies directly via npm or include it in your HTML. The class assumes
that d3 dependencies will be injected into the class via the constructor, i.e.:

```javascript
import HierarchicalPieChart from 'd3-hierarchical-pie-chart'

const chart = new HierarchicalPieChart(d3, data)
chart.render(document.querySelector("#chart"))
```

Sample data:

```javascript
var data = {
  name: "All Orders",
  description: "10 orders",
  value: 10,
  children: [
    {
      name: "Pizza Orders",
      description: "4 orders",
      value: 4,
      children: [],
    },
    {
      name: "Burger Orders",
      description: "6 orders",
      value: 6,
      children: [],
    }
  ],
}
```

Data type definition:

```typescript
interface NodeType {
  name: string,
  description: string,
  value: number,
  children: Array<NodeType>,
}
```

Note that NodeType are recursive, it can contains other NodeType as its 
children. You can think of NodeType as a tree data structure.

For more examples, see `examples/` folder.

## Supported d3 versions

This library supports d3 version 3 to version 5.

## Advanced Usage

Custom width and height (default 400px x 400px)

```javascript
const chart = new HierarchicalPieChart(d3, data, { plotWidth: 600, plotHeight: 600})
```

Custom legend

```javascript
const legendFn = (d) => {
  const name = d.name || "&nbsp;"
  const description = d.description || "&nbsp;"
  return "<h2>" + name + "</h2><p>" + description + "</p>"
}
const chart = new HierarchicalPieChart(d3, data, { legendFn: legendFn })
```

Custom label function (a label is the tooltip that appears when hovering the chart)

```javascript
const labelFn = (d) => { return d.name + ": " + d.description }
const chart = new HierarchicalPieChart(d3, data, { labelFn: labelFn })
```

Custom color scheme

```javascript
const color = d3.scaleOrdinal(d3.schemeCategory10)
const colorFn = (d) => { return color(d.name) }
const chart = new HierarchicalPieChart(d3, data, { colorFn: colorFn })
```

## Credits

The original credit goes to Andreas Dewes for creating this awesome sample
http://bl.ocks.org/adewes/4710330. My work includes making the code nicer
and more customizable.

