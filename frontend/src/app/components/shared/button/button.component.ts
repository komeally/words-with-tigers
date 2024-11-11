import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  @Input() text: string = 'Button';   // Default text if none is provided
  @Output() buttonClick = new EventEmitter<void>(); // Event emitter for button clicks

  // Emit the button click event
  onClick() {
    this.buttonClick.emit();
  }
}