// import { HttpClient } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { Injectable } from '@angular/core';
import { IDay, IDayOverview } from '../models';
import { getFormattedDate, getDetailedDate, getDateFromString } from 'src/app/util/date.utils';
import { getSortOrderLevel2 } from 'src/app/util/array.utils';
import { DbContext } from './database';
import { ILog } from '../models/log.model';
import { IMed } from '../models/med.model';
import { IMeal } from '../models/meal.model';
import { ISymptom } from '../models/symptom.model';
import { tap, map, switchMap, filter } from 'rxjs/operators';
import { ICustomEvent } from '../models/customEvent.model';
import { getDaysInMonth } from 'date-fns';

// const CALENDAR_API = '/api/calendar';
// const CALENDAR_FROM_API = '/api/calendar-from';
// const DAY_OVERVIEW_FIELDS = 'date, symptomOverviews';

@Injectable()
export class DaysService {

	constructor(
		// private readonly http: HttpClient,
		private readonly dbContext: DbContext
	) { }

	public getDaysOverviews(): Observable<IDayOverview[]> {
		return this.dbContext.asArrayObservable<IDayOverview>(
			this.dbContext.daysCollection.allDocs()
		);
	}

	public getMonthDaysOverviews(month: number, year: number): Observable<IDayOverview[]> {
		return this.dbContext.asArrayObservable<IDayOverview>(
			this.dbContext.daysCollection.allDocs()
		).pipe(
			map(days => this.getFilledMonthDays(days, month, year))
		);
	}

	public getFilledMonthDays(days: IDayOverview[], month: number, year: number): IDayOverview[] {
		const monthDays = [...days].filter(d => d.detailedDate.month === month
			&& d.detailedDate.year === year);
		for (let i = 1; i <= getDaysInMonth(new Date(year, month - 1)); i++) {
			const day = days.find(d => d.detailedDate.year === year && d.detailedDate.month === month
				&& d.detailedDate.day === i);
			if (day == null) {
				const formattedDate = year + '-' + month + '-' + i;
				const date = getDateFromString(formattedDate);
				const emptyDay = {
					'date': formattedDate,
					'detailedDate': getDetailedDate(date),
					'symptomOverviews': [],
					'symptoms': [],
					'logs': [],
					'meds': [],
					'meals': [],
					'wakeUp': '',
					'goToBed': ''
				};
				monthDays.push(emptyDay);
			}
		}
		monthDays.sort(getSortOrderLevel2('detailedDate', 'day'));
		return monthDays;
	}

	public getDays(): Observable<IDay[]> {
		return this.dbContext.asArrayObservable<IDay>(
			this.dbContext.daysCollection.allDocs()
		);
	}

	public getDay(date: string): Observable<IDay> {
		return this.dbContext.asObservable<IDay>(
			this.dbContext.daysCollection.get(date)
		);
	}

	public getSymptomOverview(day: IDay, key: string) {
		return day.symptomOverviews.find(s => s.key === key);
	}

	public getTypeLabel(type: string): string {
		const labels = new Map([
			['symptomLog', 'symptom'],
			['log', 'note'],
			['med', 'drug'],
			['meal', 'meal'],
			['wakeUp', 'wake up time'],
			['goToBed', 'bed time']]);

		return labels.get(type);
	}

	public getSymptomLog(day: IDay, time: string, key: string): Observable<ILog> {
		const symptom: ISymptom = day.symptoms.find(s => s.key === key);
		return of(symptom.logs.find(log => log.time === time));
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

	public addSymptomOverview(date: string, key: string, pain: number): Observable<IDay> {
		const day = this.getDay(date);
		return day.pipe(
			switchMap(d => {
				let symptomOverview = d.symptomOverviews.find(s => s.key === key);
				if (symptomOverview == null) {
					symptomOverview = { key, pain };
					d.symptomOverviews.push(symptomOverview);
				} else {
					symptomOverview.pain = pain;
				}
				return this.dbContext.asObservable(this.dbContext.daysCollection.put(d)).pipe(
					map(() => d)
				);
			}));
	}

	public addLog(day: IDay, time: string, key: string, detail: string): void {
		day.logs.push({ type: 'log', time, key, detail });
	}

	public getMed(day: IDay, time: string, key: string): Observable<IMed> {
		return of(day.meds.find(med => med.time === time && med.key === key));
	}

	public addMed(day: IDay, time: string, key: string, quantity: number): void {
		day.meds.push({ type: 'med', time, key, quantity });
	}

	public getMeal(day: IDay, time: string, key: string): Observable<IMeal> {
		return of(day.meals.find(meal => meal.time === time && meal.key === key));
	}

	public addMeal(day: IDay, time: string, key: string, detail: string): void {
		day.meals.push({ type: 'meal', time, key, detail });
	}

	public setStartEnd(day: IDay, time: string, type: string): void {
		switch (type) {
			case 'wakeUp':
				day.wakeUp = time;
				break;
			case 'goToBed':
				day.goToBed = time;
				break;
		}
	}

	public addEvent(date: string, customEvent: ICustomEvent): Observable<IDay> {
		const day = this.getDay(date);
		return day.pipe(
			switchMap(d => {
				switch (customEvent.type) {
					case 'symptomLog':
						this.addSymptomLog(d, customEvent.time, customEvent.key, customEvent.pain, customEvent.detail);
						break;
					case 'log':
						this.addLog(d, customEvent.time, customEvent.key, customEvent.detail);
						break;
					case 'med':
						this.addMed(d, customEvent.time, customEvent.key, customEvent.quantity);
						break;
					case 'meal':
						this.addMeal(d, customEvent.time, customEvent.key, customEvent.detail);
						break;
					case 'wakeUp':
					case 'goToBed':
						this.setStartEnd(d, customEvent.time, customEvent.type);
						break;

				}
				return this.dbContext.asObservable(this.dbContext.daysCollection.put(d)).pipe(
					map(() => d)
				);
			}));
	}

	public editEvent(date: string, oldCustomEvent: ICustomEvent, customEvent: ICustomEvent): Observable<IDay> {
		return this.deleteEvent(date, oldCustomEvent).pipe(
			switchMap(() => {
				return this.addEvent(date, customEvent);
			}));
	}

	public deleteEvent(date: string, customEvent: ICustomEvent): Observable<IDay> {
		const day = this.getDay(date);
		return day.pipe(
			switchMap(d => {
				switch (customEvent.type) {
					case 'symptomLog':
						const symptom = d.symptoms.find(s => s.key === customEvent.key);
						symptom.logs = this.filterEvent(symptom.logs, customEvent.time, customEvent.key);
						if (symptom.logs.length === 0) {
							d.symptoms = d.symptoms.filter(s => s.key !== customEvent.key);
						}
						break;
					case 'log':
						d.logs = this.filterEvent(d.logs, customEvent.time, customEvent.key);
						break;
					case 'med':
						d.meds = this.filterEvent(d.meds, customEvent.time, customEvent.key);
						break;
					case 'meal':
						d.meals = this.filterEvent(d.meals, customEvent.time, customEvent.key);
						break;
				}
				return this.dbContext.asObservable(this.dbContext.daysCollection.put(d)).pipe(
					map(() => d)
				);
			}));
	}

	public filterEvent(events: any[], time: string, key: string) {
		return events.filter((event: { time: string; key: string; }) => event.time !== time || event.key !== key);
	}

	public createNewDay(date: Date): Observable<null> {
		const formattedDate = getFormattedDate(new Date());
		const day = {
			'_id': formattedDate,
			'date': formattedDate,
			'detailedDate': getDetailedDate(date),
			'symptomOverviews': [],
			'symptoms': [],
			'logs': [],
			'meds': [],
			'meals': [],
			'wakeUp': '',
			'goToBed': ''
		};
		return this.dbContext.asObservable(this.dbContext.daysCollection.put(day)).pipe(
			map(() => null)
		);
	}

	public addDay(day: IDay): Observable<IDay> {
		return this.dbContext.asObservable(this.dbContext.daysCollection.put(day)).pipe(
			map(() => day)
		);
	}

	public createNewDayToday(): Observable<null> {
		return this.createNewDay(new Date());
	}

	public removeDayByDate(date: string): Observable<IDay> {
		return this.getDay(date).pipe(
			switchMap(day => {
				return this.dbContext.asObservable(this.dbContext.daysCollection.remove(day)).pipe(
					map(() => day)
				);
			}));
	}

	public removeDay(day: IDay): Observable<IDay> {
		return this.dbContext.asObservable(this.dbContext.daysCollection.remove(day)).pipe(
			map(() => day)
		);
	}

	public reset(): Observable<null> {
		return this.dbContext.daysCollection.reset().pipe(
			map(() => null)
		);
	}
}
