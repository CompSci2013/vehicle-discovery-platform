import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UrlStateService } from './core/services/url-state.service';

@NgModule({
  declarations: [
    AppComponent
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
