---
layout: default
title: "Keyao's Blog"
---

<link rel="stylesheet" href="{{ '/assets/css/styles.css' | relative_url }}">

<nav class="navigation">
  <a href="{{ site.baseurl }}/">Home</a>
  <a href="{{ site.baseurl }}/blog/">Blog</a>
  <a href="{{ site.baseurl }}/projects/">Projects</a>
  <a href="{{ site.baseurl }}/papers/">Papers</a>
</nav>

<div class="container home-container">
  <div class="hero-section">
    <h1 class="hero-title">{{ page.title }}</h1>
    <p class="hero-subtitle">Exploring the world of statistics and machine learning</p>
  </div>

  <div class="about-card card">
    <h2>👋 About Me</h2>
    <p>I'm a passionate biostatistics researcher at Harvard University. Here, I document my journey through personal development, share insights, and explore new knowledge.</p>
  </div>

  <div class="home-grid">
    <div class="home-section card">
      <div class="section-header">
        <div class="icon">📝</div>
        <h3>Latest Blog Posts</h3>
      </div>
      {% assign blog_files = site.pages | where_exp: "page", "page.path contains 'blog/'" | where_exp: "page", "page.path contains '.md'" | where_exp: "page", "page.date != nil" | sort: "date" | reverse %}
      {% if blog_files.size > 0 %}
      <ul class="home-list">
        {% for post in blog_files limit:2 %}
        <li>
          <a href="{{ site.baseurl }}{{ post.permalink }}" class="home-link">
            <span class="link-title">{{ post.title }}</span>
            <span class="link-date">{{ post.date | date: "%b %d, %Y" }}</span>
          </a>
        </li>
        {% endfor %}
      </ul>
      <a href="{{ site.baseurl }}/blog/" class="view-all-link">View all posts →</a>
      {% else %}
      <p class="empty-state">No blog posts yet. Check back soon!</p>
      {% endif %}
    </div>

    <div class="home-section card">
      <div class="section-header">
        <div class="icon">💡</div>
        <h3>Featured Projects</h3>
      </div>
      {% assign project_pages = site.pages | where_exp: "page", "page.path contains 'projects'" | where_exp: "page", "page.name != 'index.html'" %}
      {% if project_pages.size > 0 %}
      <ul class="home-list">
        {% for project in project_pages limit:2 %}
        <li>
          <a href="{{ site.baseurl }}{{ project.permalink }}" class="home-link">
            <span class="link-title">{{ project.title }}</span>
          </a>
        </li>
        {% endfor %}
      </ul>
      <a href="{{ site.baseurl }}/projects/" class="view-all-link">View all projects →</a>
      {% else %}
      <p class="empty-state">No projects yet. Stay tuned!</p>
      {% endif %}
    </div>

    <div class="home-section card">
      <div class="section-header">
        <div class="icon">🎯</div>
        <h3>Skills & Interests</h3>
      </div>
      <ul class="skills-list">
        <li><span class="skill-tag">Statistics</span></li>
        <li><span class="skill-tag">Machine Learning</span></li>
        <li><span class="skill-tag">Python & R</span></li>
      </ul>
    </div>
  </div>

  <div class="social-section card">
    <h3>Connect With Me</h3>
    <div class="social-links">
      <a href="https://github.com/kyZhan2002" target="_blank" class="social-link">
        <i class="fab fa-github"></i> GitHub
      </a>
      <a href="mailto:kzhan@g.harvard.edu" class="social-link">
        <i class="fas fa-envelope"></i> Email
      </a>
    </div>
  </div>
</div>

<footer>
  <p>© {{ site.time | date: '%Y' }} Keyao Zhan. Built with Jekyll and GitHub Pages.</p>
</footer>
