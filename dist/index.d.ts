interface NodeType {
    name: string;
    description: string;
    value: number;
    children: Array<NodeType>;
}
interface ArcDatum {
    startAngle: number;
    stopAngle: number;
    name: string;
    description: string;
    value: number;
    level: number;
}
/**
 * General constructs to store navigation history.
 *
 * It's implemented as a stack.
 */
declare class NavigationHistory {
    history: Array<any>;
    constructor(history: Array<any>);
    navigate(t: any): void;
    back(): void;
    /**
     * Return the current navigation
     */
    current(): any;
    /**
     * Return the previous navigation
     */
    previous(): any;
    /**
     * Return the number of entries stored in the history.
     */
    size(): number;
}
declare class HierarchicalPieChart {
    d3: any;
    data: NodeType;
    arcData: Array<ArcDatum>;
    currentArc?: ArcDatum;
    plotWidth: number;
    plotHeight: number;
    labelFn: (d: ArcDatum) => string;
    legendFn: (d: ArcDatum) => string;
    colorFn: (d: ArcDatum) => string;
    animating: boolean;
    arcClickHistory: NavigationHistory;
    constructor(d3: any, data: any, options?: {
        plotWidth?: number;
        plotHeight?: number;
        labelFn?: (d: ArcDatum) => string;
        legendFn?: (d: ArcDatum) => string;
        colorFn?: (d: ArcDatum) => string;
    });
    /**
     * Render hierarchical pie chart on a given element.
     */
    render(el: HTMLElement): void;
    /**
     * Interpolates arc during animation.
     */
    private arcTween;
    /**
     * Callback when an arc is clicked.
     *
     * The parameter arc is actually a function returned from calling `d3.arc()`.
     * We're using any because of a lack of d3 type annotations.
     */
    private onClickArc;
    /**
     * Get the depth of the `data` tree
     */
    private maxLevel;
    private processData;
    private getStartAngle;
    private getStopAngle;
    private getLevel;
}
