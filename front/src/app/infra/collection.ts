import * as PouchDB from 'pouchdb/dist/pouchdb';
import { Observable, from } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export class Collection {

	private id: string;
	private db: PouchDB;

	constructor(id: string) {
		this.id = id;
		this.db = new PouchDB(this.id);
	}

	public allDocs<T>(): Promise<{ rows: { doc: T }[] }> {
		return this.db.allDocs({ include_docs: true, descending: true });
	}

	public get<T>(id: string): T {
		return this.db.get(id);
	}

	public put<T>(doc: T): Promise<T> {
		return this.db.put(doc);
	}

	public remove<T>(doc: T): Promise<T> {
		return this.db.remove(doc);
	}

	public reset(): Observable<null> {
		return from(this.db.destroy()).pipe(
			tap(() => { this.db = new PouchDB(this.id); }),
			map(() => null)
		);
	}
}