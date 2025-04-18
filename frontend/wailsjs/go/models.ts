export namespace main {
	
	export class Details {
	    parent_model: string;
	    format: string;
	    family: string;
	    families: string[];
	    parameter_size: string;
	    quantization_level: string;
	
	    static createFrom(source: any = {}) {
	        return new Details(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.parent_model = source["parent_model"];
	        this.format = source["format"];
	        this.family = source["family"];
	        this.families = source["families"];
	        this.parameter_size = source["parameter_size"];
	        this.quantization_level = source["quantization_level"];
	    }
	}
	export class Model {
	    name: string;
	    model: string;
	    // Go type: time
	    modified_at: any;
	    size: number;
	    digest: string;
	    details: Details;
	
	    static createFrom(source: any = {}) {
	        return new Model(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.model = source["model"];
	        this.modified_at = this.convertValues(source["modified_at"], null);
	        this.size = source["size"];
	        this.digest = source["digest"];
	        this.details = this.convertValues(source["details"], Details);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ModelsResponse {
	    models: Model[];
	
	    static createFrom(source: any = {}) {
	        return new ModelsResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.models = this.convertValues(source["models"], Model);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

