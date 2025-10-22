import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CountdownComponent } from '../countdown/countdown';
import { RouterModule } from '@angular/router';
import { Footer } from '../../Shared/footer/footer';

@Component({
    selector: 'app-contact-us',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CountdownComponent, Footer],
    templateUrl: './contact-us.html',
    styleUrl: './contact-us.css'
})
export class ContactUsComponent { }
