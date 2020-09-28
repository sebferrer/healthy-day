import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { IDay, IDayOverview } from '../models';
import { environment } from '../../environments/environment';

const CALENDAR_API = '/api/calendar';
const DAY_OVERVIEW_FIELDS = 'date,symptomOverviews';

@Injectable()
export class DaysService {
	private static daysOverview: Observable<IDayOverview[]>;
	private static calendar: Observable<IDay[]>;

	constructor(private http: HttpClient) { }

	public getDaysOverviews(): Observable<IDayOverview[]> {
		if (DaysService.calendar == null) {
			DaysService.daysOverview = this.http.get<IDayOverview[]>(
				`${environment.backendUrl}${CALENDAR_API}`
			).pipe(
				shareReplay(1)
			);
		}
		return DaysService.daysOverview;
	}

	public getDays(): Observable<IDay[]> {
		if (DaysService.calendar == null) {
			DaysService.calendar = this.http.get<IDay[]>(
				`${environment.backendUrl}${CALENDAR_API}`
			).pipe(
				shareReplay(1)
			);
		}
		return DaysService.calendar;
	}

	public getDay(date: string): Observable<IDay> {
		return this.http.get<IDay>(
			`${environment.backendUrl}${CALENDAR_API}/${date}`
		).pipe(
			shareReplay(1)
		);
	}

	public getTypeLabel(type: string): string {
		const labels = new Map([
			['symptomLog', 'Symptom'],
			['log', 'Custom event'],
			['med', 'Drug'],
			['meal', 'Meal']]);

		return labels.get(type);
	}

	public addSymptomLog(day: IDay, time: string, key: string, pain: number, detail: string): void {
		let symptom = day.symptoms.find(s => s.key === key);
		if (symptom == null) {
			const symptomLogs = Array<any>();
			symptom = { type: 'symptom', key, logs: symptomLogs };
			day.symptoms.push(symptom);
		}
		day.symptoms.find(s => s.key === key).logs.push({ type: 'symptomLog', time, key, pain, detail });
	}

	public addLog(day: IDay, time: string, detail: string): void {
		day.logs.push({ type: 'log', time, detail });
	}

	public addMed(day: IDay, time: string, key: string, quantity: string): void {
		day.meds.push({ type: 'med', time, key, quantity });
	}

	public addMeal(day: IDay, time: string, detail: string): void {
		day.meals.push({ type: 'meal', time, detail });
	}

	public addEvent(
		date: string,
		time: string,
		type: string,
		key: string,
		pain: number,
		detail: string,
		quantity: string): Observable<never> {
		const day = this.getDay(date);
		day.subscribe(d => {
			switch (type) {
				case 'symptomLog':
					this.addSymptomLog(d, time, key, pain, detail);
					break;
				case 'log':
					this.addLog(d, time, detail);
					break;
				case 'med':
					this.addMed(d, time, key, quantity);
					break;
				case 'meal':
					this.addMeal(d, time, detail);
					break;
			}
			this.http.put<IDay>(
				`${environment.backendUrl}${CALENDAR_API}/${date}`, d
			).subscribe();
		});
		return of();
	}

	public deleteEvent(date: string, time: string, type: string, key: string): Observable<never> {
		const day = this.getDay(date);

		day.subscribe(d => {
			switch (type) {
				case 'symptomLog':
					const symptom = d.symptoms.find(s => s.key === key);
					symptom.logs = this.filterTimeEvent(symptom.logs, time);
					if (symptom.logs.length === 0) {
						d.symptoms = d.symptoms.filter(s => s.key !== key);
					}
					break;
				case 'log':
					d.logs = this.filterTimeEvent(d.logs, time);
					break;
				case 'med':
					d.meds = this.filterTimeEvent(d.meds, time);
					break;
				case 'meal':
					d.meals = this.filterTimeEvent(d.meals, time);
					break;
			}

			this.http.put<IDay>(
				`${environment.backendUrl}${CALENDAR_API}/${date}`, d
			).subscribe();
		});

		return of();
	}

	public filterTimeEvent(events: any[], time: string) {
		return events.filter((event: { time: string; }) => event.time !== time);
	}

}
