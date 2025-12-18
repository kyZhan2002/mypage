---
layout: post
title: "Hello World - Starting My Blog"
date: 2025-02-10
categories: blog
permalink: /blog/First_Blog
---

Welcome to my first blog post! I'm excited to start sharing my journey here. This blog will serve as a platform for documenting my learning experiences and sharing knowledge.


## Example math: Eigenvalues and Eigenvectors

One of the most important concepts in linear algebra is that of **eigenvalues** and **eigenvectors**. For a square matrix $A$, a non-zero vector $\mathbf{v}$ is an eigenvector if:

$$A\mathbf{v} = \lambda\mathbf{v}$$

where $\lambda$ is the corresponding **eigenvalue**. This equation can be rewritten as:

$$(A - \lambda I)\mathbf{v} = \mathbf{0}$$

For this to have a non-trivial solution, we require:

$$\det(A - \lambda I) = 0$$

This is called the **characteristic equation**. For example, for a $2 \times 2$ matrix:

$$\det\begin{pmatrix} a-\lambda & b \\ c & d-\lambda \end{pmatrix} = (a-\lambda)(d-\lambda) - bc = 0$$

Expanding this gives us the characteristic polynomial:

$$\lambda^2 - (a+d)\lambda + (ad - bc) = 0$$

Stay tuned for more content!