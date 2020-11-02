import { Injectable } from '@angular/core';
import { DaysService } from './days.service';
import { saveAs } from 'file-saver';
import { DayViewModel } from '../models/day.view.model';
import { IDay } from '../models';
import { getDateFromString, getDetailedDate } from 'src/app/util/date.utils';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class ImporterExporterService {

	constructor(
		private daysService: DaysService
	) { }

	public importData(event: any): Observable<null> {
		const selectedFile = event.target.files[0];
		const reader = new FileReader();

		reader.onload = (readerLoadEvent: any) => {
			const fileContent = readerLoadEvent.target.result;
			const jsonArr = JSON.parse(fileContent);
			for (const jsonObj of jsonArr) {
				const day: IDay = jsonObj;
				day.detailedDate = getDetailedDate(getDateFromString(day.date));
				this.daysService.addDay(day);
			}
		};

		return this.daysService.reset().pipe(
			tap(() => {
				reader.readAsText(selectedFile);
			}),
			map(() => null)
		);
	}

	public exportData(): void {
		this.daysService.getDays().subscribe(days => {
			const fileContent = JSON.stringify(days);
			const newDays: IDay[] = JSON.parse(fileContent);
			newDays.map(day => {
				delete day['_rev'];
				delete day['detailedDate'];
			});
			const file = new File([JSON.stringify(newDays)], 'calendar.json', { type: 'application/json;charset=utf-8' });
			saveAs(file);
		});
	}

	public exportHtml(): void {
		this.daysService.getDays().subscribe(days => {
			let html = '';
			for (const day of days) {
				const dayViewModel = new DayViewModel(day);
				html += dayViewModel.date + '<br/><br/>';
				html += 'Wake up: ' + dayViewModel.wakeUp + '<br/>';
				html += 'Go to bed: ' + dayViewModel.goToBed + '<br/><br/>';
				html += 'My day: <br/>';
				for (const content of dayViewModel.content) {
					switch (content.type) {
						case 'symptom':
							html += '[Symptom] ' + content.time + ' -- ' + content.key + '(' + content.pain + '/5): ' + content.detail + '<br/>';
							break;
						case 'log':
							html += '[Log] ' + content.time + ' -- ' + content.detail + '<br/>';
							break;
						case 'med':
							html += '[Med] ' + content.time + ' -- ' + content.key + content.quantity + '<br/>';
							break;
						case 'meal':
							html += '[Meal] ' + content.time + ' -- ' + content.key + ' ' + content.detail + '<br/>';
							break;
					}
				}
				html += '<hr/>';
			}
			const file = new File([html], 'calendar.html', { type: 'text/plain;charset=utf-8' });
			saveAs(file);
		});
	}

}