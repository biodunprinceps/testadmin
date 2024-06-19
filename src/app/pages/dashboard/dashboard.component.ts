import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../services/localstorage.service';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule } from '@angular/google-maps';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,GoogleMapsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  contacts: any[] = [];

  constructor(private localStorageService: LocalStorageService) { }

  ngOnInit() {
    this.loadContactsFromLocalStorage();
  }

  loadContactsFromLocalStorage() {
    const storedContacts:any = this.localStorageService.getItem('contacts');
    this.contacts = storedContacts ? JSON.parse(storedContacts) : [];
  }
}
