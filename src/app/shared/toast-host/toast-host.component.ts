import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-host.component.html',
  styleUrls: ['./toast-host.component.scss'],
})
export class ToastHostComponent
{
  constructor(public toast: ToastService) { }
}
