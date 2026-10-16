#!/usr/bin/env python3
"""Capture homepage screenshots for PR (dark/light, desktop/mobile)."""
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path("/opt/cursor/artifacts/screenshots")
URL = "http://127.0.0.1:8765/"
SHOTS = [
    ("portfolio-desktop-dark.png", {"width": 1280, "height": 2200}, "dark", 1),
    ("portfolio-mobile-dark.png", {"width": 390, "height": 2400}, "dark", 2),
    ("portfolio-desktop-light.png", {"width": 1280, "height": 2200}, "light", 1),
    ("portfolio-mobile-light.png", {"width": 390, "height": 2400}, "light", 2),
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for name, viewport, scheme, scale in SHOTS:
            context = browser.new_context(
                viewport=viewport,
                device_scale_factor=scale,
                color_scheme=scheme,
            )
            page = context.new_page()
            page.goto(URL, wait_until="networkidle")
            page.evaluate(
                """() => {
                  document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
                }"""
            )
            page.wait_for_timeout(200)
            page.screenshot(path=str(OUT / name), full_page=True)
            context.close()
        browser.close()


if __name__ == "__main__":
    main()
