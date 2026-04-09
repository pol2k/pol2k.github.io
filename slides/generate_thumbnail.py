#!/usr/bin/env python3
"""
Generate thumbnail from the first slide of a reveal.js presentation.

Usage: python generate_thumbnail.py <html_file> <output_image.png>
"""

import sys
import os
from pathlib import Path
from playwright.sync_api import sync_playwright


def generate_thumbnail(html_path, output_path, width=1920, height=1080):
    """
    Generate a thumbnail from the first slide of a reveal.js presentation.

    Args:
        html_path: Path to the HTML file
        output_path: Path where to save the thumbnail PNG
        width: Screenshot width in pixels (default: 1920)
        height: Screenshot height in pixels (default: 1080)
    """
    # Convert to absolute paths
    html_path = Path(html_path).resolve()
    output_path = Path(output_path).resolve()

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Check if input file exists
    if not html_path.exists():
        print(f"Error: HTML file not found: {html_path}", file=sys.stderr)
        sys.exit(1)

    # Use file:// URL for local files
    url = f"file://{html_path}"

    print(f"Generating thumbnail from: {html_path}")
    print(f"Output will be saved to: {output_path}")

    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)

        # Create a new page with specified viewport
        page = browser.new_page(viewport={'width': width, 'height': height})

        try:
            # Navigate to the presentation
            page.goto(url, wait_until='networkidle')

            # Wait for reveal.js to initialize
            page.wait_for_selector('.reveal .slides', timeout=10000)

            # Additional wait to ensure fonts and images are loaded
            page.wait_for_timeout(1000)

            # Get the reveal.js slide container
            slide_element = page.locator('.reveal .slides')

            # Take screenshot of the first slide
            slide_element.screenshot(path=str(output_path))

            print(f"✓ Thumbnail generated successfully: {output_path}")

        except Exception as e:
            print(f"Error generating thumbnail: {e}", file=sys.stderr)
            sys.exit(1)
        finally:
            browser.close()


def main():
    if len(sys.argv) != 3:
        print("Usage: generate_thumbnail.py <html_file> <output_image.png>", file=sys.stderr)
        print("\nExample:", file=sys.stderr)
        print("  generate_thumbnail.py 1_introduction/cours_1_intro.html thumbnails/intro.png", file=sys.stderr)
        sys.exit(1)

    html_file = sys.argv[1]
    output_file = sys.argv[2]

    generate_thumbnail(html_file, output_file)


if __name__ == "__main__":
    main()
