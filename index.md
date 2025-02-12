---
layout: default
title: "Keyao's Coding Blog"
---

<link rel="stylesheet" href="{{ '/assets/css/styles.css' | relative_url }}">

<div class="container">
  <div class="header">
    <h1>{{ page.title }}</h1>
    <p class="lead">Exploring Software Development & Computer Science</p>
  </div>

  <div class="card">
    <h2>👋 About Me</h2>
    <p>I'm a passionate programmer and computer science enthusiast at Harvard University. Here, I document my journey through software development, share insights, and explore new technologies.</p>
  </div>

  <div class="grid">
    <div class="card">
      <div class="icon">📝</div>
      <h3>Latest Blog Posts</h3>
      <ul>
        <li><a href="/blog/first-blog">First Steps with GitHub Pages</a></li>
        <li><em>More posts coming soon...</em></li>
      </ul>
    </div>

    <div class="card">
      <div class="icon">💡</div>
      <h3>Featured Projects</h3>
      <ul>
        <li>Project 1 (Coming Soon)</li>
        <li>Project 2 (Coming Soon)</li>
      </ul>
    </div>

    <div class="card">
      <div class="icon">🎯</div>
      <h3>Skills & Interests</h3>
      <ul>
        <li>Software Development</li>
        <li>Algorithms & Data Structures</li>
        <li>Web Technologies</li>
        <li>Machine Learning</li>
      </ul>
    </div>
  </div>

  <div class="social-links card">
    <h3>Connect With Me</h3>
    <a href="https://github.com/kyZhan2002" target="_blank">
      <i class="fab fa-github"></i> GitHub
    </a>
    <a href="mailto:kzhan@g.harvard.edu">
      <i class="fas fa-envelope"></i> Email
    </a>
  </div>
</div>

<footer>
  <p>© {{ site.time | date: '%Y' }} Keyao Zhan. Built with Jekyll and GitHub Pages.</p>
</footer>
