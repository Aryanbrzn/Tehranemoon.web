import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountdownComponent } from '../countdown/countdown';
import { RouterModule } from '@angular/router';
import { Footer } from '../../Shared/footer/footer';

@Component({
    selector: 'app-about-us',
    standalone: true,
    imports: [CommonModule, RouterModule, CountdownComponent, Footer],
    templateUrl: './about-us.html',
    styleUrl: './about-us.css'
})
export class AboutUsComponent {

}
