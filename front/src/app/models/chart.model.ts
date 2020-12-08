export abstract class AChart {
	public type: string;
	public title: string;
	public data: any[][];
	public columns: string[];
	public options: any;

	constructor(type: string, title: string) {
		this.type = type;
		this.title = title;
		this.data = new Array<Array<string | number>>();
		this.columns = new Array<string>();
	}
}