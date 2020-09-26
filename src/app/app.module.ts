import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MatButtonModule, MatCardModule, MatGridListModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule, MatToolbarModule, MatListModule, MatChipsModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './ui';
import { DayComponent } from './ui/day';
import { DaysService } from './infra';
import { CalendarComponent } from './ui/calendar';
import { TimelineComponent } from './ui/timeline';

@NgModule({
	declarations: [
		AppComponent,
		HomeComponent,
		DayComponent,
		CalendarComponent,
		TimelineComponent
	],
	imports: [
		BrowserModule,
		HttpClientModule,
		AppRoutingModule,
		MatMenuModule,
		MatButtonModule,
		MatIconModule,
		MatToolbarModule,
		MatProgressSpinnerModule,
		MatCardModule,
		MatGridListModule,
		MatListModule,
		MatChipsModule,
		BrowserAnimationsModule
	],
	providers: [
		DaysService
	],
	bootstrap: [AppComponent]
})
export class AppModule { }