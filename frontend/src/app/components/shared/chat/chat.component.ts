import { Component } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {

  sendMessage(): void {
    console.log("Test");
  }
}
