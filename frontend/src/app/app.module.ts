import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { DemoModule } from './demo/demo.module';
import { UrlStateService } from './core/services/url-state.service';
import { HomeComponent } from './features/home/home.component';
import { SearchComponent } from './features/search/search.component';
import { WorkshopComponent } from './features/workshop/workshop.component';
import { DemoComponent } from './features/demo/demo.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SearchComponent,
    WorkshopComponent,
    DemoComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,  // Required for PrimeNG animations
    HttpClientModule,  // Required for ApiService HTTP requests
    AppRoutingModule,
    SharedModule,  // Shared components and PrimeNG modules
    DemoModule  // Demo data and services
  ],
  providers: [
    UrlStateService  // Explicitly provide the service
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
