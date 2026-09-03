# Anant Mishra - Personal Portfolio Website

A cinematic, interactive portfolio website featuring a buttery-smooth 240-frame scroll-driven canvas scrubbing engine, glassmorphic UI components, and modern responsive typography.

## 🚀 Features

- **Smooth Scroll-Based Scrubbing Engine**: Canvas-based frame rendering decoupled from scroll events via `requestAnimationFrame` with exponential smoothing (lerp).
- **High-DPI / Retina Crispness**: Automatically adapts to device pixel ratios (`window.devicePixelRatio`).
- **Aspect-Aware Cover Scaling**: Maintains optimal 16:9 frame composition across all screen aspect ratios and viewports.
- **Intelligent Frame Preloader**: Priority-based progressive loading with nearest-frame fallback to ensure zero stutter or blank screens during fast scrolling.
- **Modern Glassmorphic UI**:
  - Fixed top navigation bar with dynamic active-link indicators.
  - Left-aligned Hero section highlighting Software Engineering, Java, Python, and AI/ML focus.
  - Interactive Skills & Competencies grid with live badges.
  - Experience card highlighting GeeksforGeeks Campus Mantri leadership.
  - Bottom contact section with direct email, LinkedIn, and smooth back-to-top navigation.

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3, Modern JavaScript (ES6+)
- **Graphics & Animation**: HTML5 2D Canvas, `requestAnimationFrame`, Linear Interpolation (Lerp)
- **Typography**: Google Fonts (*Cinzel* display serif, *Plus Jakarta Sans*)

## 📦 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/anantmishra7/Portfolio.git
   cd Portfolio
   ```

2. Serve locally with any HTTP static server:
   ```bash
   # Using Python:
   python -m http.server 8080

   # Or using Node.js:
   npx serve .
   ```

3. Open `http://localhost:8080` in your web browser.

---
Crafted by **Anant Mishra** • [LinkedIn](https://www.linkedin.com/in/anantmishra07/) • [Email](mailto:anantm408@gmail.com)
