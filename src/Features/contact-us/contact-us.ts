import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CountdownComponent } from '../countdown/countdown';
import { RouterModule } from '@angular/router';
import { Footer } from '../../Shared/footer/footer';
import { SEOService } from '../../Core/services/seo.service';
import { environment } from '../../environments/environment';

@Component({
    selector: 'app-contact-us',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CountdownComponent, Footer],
    templateUrl: './contact-us.html',
    styleUrl: './contact-us.css'
})
export class ContactUsComponent implements OnInit {
    private seoService = inject(SEOService);

    ngOnInit() {
        this.seoService.updateTags({
            title: 'تماس با ما - تهرانمون',
            description: 'تماس با تیم تهرانمون. اگر سوال، پیشنهاد یا مشکلی دارید، با ما در تماس باشید. ما آماده پاسخگویی به شما هستیم.',
            keywords: 'تماس با تهرانمون, پشتیبانی تهرانمون, ارتباط با تهرانمون, گزارش مشکل',
            url: `${environment.webUrl}/contact`,
            type: 'website',
            structuredData: {
                "@context": "https://schema.org",
                "@type": "ContactPage",
                "name": "تماس با ما",
                "description": "صفحه تماس با تیم تهرانمون",
                "url": `${environment.webUrl}/contact`
            }
        });
    }
}
