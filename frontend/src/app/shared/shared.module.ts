/*
  SHARED MODULE

  PURPOSE:
  Centralized module for shared components, directives, and PrimeNG imports.
  Import this module in feature modules to access common functionality.

  EXPORTS:
  - BaseTableComponent (universal configuration-driven table)
  - All PrimeNG modules needed across the app
  - CommonModule, FormsModule, ReactiveFormsModule
*/

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { MessagesModule } from 'primeng/messages';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';

// Shared Components
import { BaseTableComponent } from './components/base-table/base-table.component';


@NgModule({
  declarations: [
    BaseTableComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // PrimeNG
    TableModule,
    ButtonModule,
    CheckboxModule,
    MessageModule,
    MessagesModule,
    ProgressSpinnerModule,
    CardModule,
    PanelModule,
    InputTextModule,
    DropdownModule,
    PaginatorModule,
    TooltipModule
  ],
  exports: [
    // Angular modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // PrimeNG modules
    TableModule,
    ButtonModule,
    CheckboxModule,
    MessageModule,
    MessagesModule,
    ProgressSpinnerModule,
    CardModule,
    PanelModule,
    InputTextModule,
    DropdownModule,
    PaginatorModule,
    TooltipModule,
    // Shared components
    BaseTableComponent
  ]
})
export class SharedModule { }
