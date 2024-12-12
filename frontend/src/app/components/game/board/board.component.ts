import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { SVG, Svg } from '@svgdotjs/svg.js';

@Component({
  selector: 'game-board',
  standalone: true,
  imports: [],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
})
export class BoardComponent implements AfterViewInit {
  private boardSize = 15; // 15x15 grid
  private tileSize = 50; // Each tile is 50x50 pixels

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.initializeBoard();
  }

  private async initializeBoard(): Promise<void> {
    const boardContainer =
      this.el.nativeElement.querySelector('.board-container');
    const draw: Svg = SVG()
      .addTo(boardContainer)
      .size(this.boardSize * this.tileSize, this.boardSize * this.tileSize);

    // Set the board background
    draw
      .rect(this.boardSize * this.tileSize, this.boardSize * this.tileSize)

    // Load and populate tiles
    const tileSvg = await this.loadTileTemplate(); // Load the SVG template for empty tiles
    this.populateBoard(draw, tileSvg);
  }

  private async loadTileTemplate(): Promise<string> {
    const response = await fetch('/assets/tiles/empty-tile.svg'); // Adjust path to your SVG file
    return await response.text();
  }

  private populateBoard(draw: Svg, tileSvg: string): void {
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        const tile = SVG(tileSvg);
        tile.move(col * this.tileSize, row * this.tileSize);
        draw.add(tile);
      }
    }
  }
}
