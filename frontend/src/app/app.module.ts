import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UrlStateService } from './core/services/url-state.service';
import { HomeComponent } from './features/home/home.component';
import { SearchComponent } from './features/search/search.component';
import { WorkshopComponent } from './features/workshop/workshop.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SearchComponent,
    WorkshopComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    UrlStateService  // Explicitly provide the service
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
