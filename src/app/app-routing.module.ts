import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { HomeComponent } from './ui';
import { DayComponent } from './ui/day';
import { CalendarComponent } from './ui/calendar';
import { TimelineComponent } from './ui/timeline';

const routes: Routes = [
	{
		path: '',
		component: HomeComponent
	},
	{
		path: 'calendar',
		component: CalendarComponent
	},
	{
		path: 'timeline',
		component: TimelineComponent
	},
	{
		path: ':date',
		component: DayComponent
	},
];

@NgModule({
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		MatMenuModule,
		RouterModule.forRoot(routes)
	],
	exports: [RouterModule],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppRoutingModule { }