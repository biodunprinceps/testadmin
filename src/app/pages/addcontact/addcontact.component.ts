import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms'; // Import FormsModule
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { LocalStorageService } from '../../services/localstorage.service';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-addcontact',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatSnackBarModule,
    HttpClientModule,
  ],
  templateUrl: './addcontact.component.html',
  styleUrl: './addcontact.component.scss',
})
export class AddcontactComponent implements OnInit {
  private accessToken =
    'pk.eyJ1Ijoic2l4Zm8iLCJhIjoiY2ttcXVsdnJwMDFtajJ5cGJ3OG54OWhuNCJ9.iWIOYnsyXh0ZI4YQl92Ecg';
  addContactForm!: FormGroup;
  // phoneNumberPattern = '^\+?\d{1,2}?[-\s]?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}$';

  constructor(
    private formBuilder: FormBuilder,
    private localstorage: LocalStorageService,
    private toastr: ToastrService,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.initForm();
    this.addresses.valueChanges.subscribe(() => {
      this.updateLatLngFields();
    });
  }

  initForm() {
    this.addContactForm = this.formBuilder.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      email: ['', [Validators.required, Validators.email]],
      addresses: this.formBuilder.array(
        [this.createAddressGroup()],
        [Validators.required, Validators.maxLength(5)]
      ),
      longitude: ['', { updateOn: 'blur' }],
      latitude: ['', { updateOn: 'blur' }],
    });
  }

  updateLatLngFields() {
    const addresses = this.addContactForm.get('addresses')?.value as {
      address: string;
    }[];

    const promises = addresses.map(({ address }) =>
      this.getLatLngFromAddress(address)
    );


    Promise.all(promises)
      .then((latLngs) => {
        const longitudeControl = this.addContactForm.get('longitude');
        const latitudeControl = this.addContactForm.get('latitude');

        longitudeControl?.setValue(latLngs.map((latLng:any) => latLng.lng));
        latitudeControl?.setValue(latLngs.map((latLng:any) => latLng.lat));
      })
      .catch((error) => {
        console.error(error);
        this.snackBar.open(
          'Failed to get latitude and longitude from addresses',
          'Close',
          {
            duration: 3000,
          }
        );
      });
  }

  getLatLngFromAddress(address: string) {
    console.log('Address: ' + address);  //

    // Check if the address is empty
    if (address === '') {
      console.log('Address is empty, skipping API call.');
      return { lat: '', lng: '' }; // Return early to skip the API call
    }

    const apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?access_token=${this.accessToken}`;

    return this.http
      .get<any>(apiUrl)
      .toPromise()
      .then((response) => {
        if (response.features.length > 0) {
          const { coordinates } = response.features[0].geometry;
          return { lat: coordinates[1], lng: coordinates[0] };
        } else {
          throw new Error('Failed to get latitude and longitude from address');
        }
      });
  }

  get addresses() {
    return this.addContactForm.get('addresses') as FormArray;
  }

  createAddressGroup() {
    return this.formBuilder.group({
      address: ['', Validators.required],
    });
  }

  addAddress() {
    if (this.addresses.length < 5) {
      this.addresses.push(this.createAddressGroup());
    }
  }

  removeAddress(index: number) {
    this.addresses.removeAt(index);
  }

  onSubmit() {
    if (this.addContactForm.valid) {
      const addresses = this.addContactForm.get('addresses')?.value as {
        address: string;
      }[];
      const promises = addresses.map(({ address }) =>
        this.getLatLngFromAddress(address)
      );

      Promise.all(promises)
        .then((latLngs) => {
          const formValue = this.addContactForm.value;
          formValue.longitude = latLngs.map((latLng:any) => latLng.lng);
          formValue.latitude = latLngs.map((latLng:any) => latLng.lat);

          const existingContacts: any = this.localstorage.getItem('contacts');
          const contactsArray = existingContacts
            ? JSON.parse(existingContacts)
            : [];
          contactsArray.push(formValue);
          this.localstorage.setItem('contacts', JSON.stringify(contactsArray));

          this.snackBar.open('Contact added successfully!', 'Close', {
            duration: 3000,
          });

          // Reset the form
          this.addContactForm.reset();
          this.addContactForm.markAsPristine();
          this.addContactForm.markAsUntouched();
          this.addresses.clear();
          this.addAddress();
        })
        .catch((error) => {
          console.error(error);
          this.snackBar.open(
            'Failed to get latitude and longitude from addresses',
            'Close',
            {
              duration: 3000,
            }
          );
        });
    } else {
      this.showFormErrors();
    }
  }

  showFormErrors() {
    for (const key in this.addContactForm.controls) {
      if (this.addContactForm.controls.hasOwnProperty(key)) {
        const control = this.addContactForm.controls[key];

        control.markAsDirty();
        control.markAsTouched();

        if (control instanceof FormArray) {
          (control as FormArray).controls.forEach((group) => {
            for (const groupKey in (group as FormGroup).controls) {
              if ((group as FormGroup).controls.hasOwnProperty(groupKey)) {
                const groupControl = (group as FormGroup).controls[groupKey];
                groupControl.markAsDirty();
                groupControl.markAsTouched();
              }
            }
          });
        }
      }
    }

    // Show an error snackbar notification
    this.snackBar.open('Please correct the highlighted errors.', 'Close', {
      duration: 3000,
    });
  }
}
