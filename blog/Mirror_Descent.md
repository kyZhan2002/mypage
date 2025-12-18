---
layout: post
title: "Mirror Descent: A Geometric View of Optimization"
date: 2025-02-15
categories: blog
permalink: /blog/Mirror_Descent
---

Mirror descent is a powerful optimization algorithm that generalizes gradient descent by incorporating the geometry of the problem space. In this post, I'll explore the intuition behind mirror descent, its mathematical foundations, and why it's particularly useful for certain types of problems.

## Introduction to Mirror Descent

Standard gradient descent updates parameters by moving in the direction opposite to the gradient. However, this approach assumes a Euclidean geometry, which may not be appropriate for all problems. Mirror descent addresses this by allowing optimization in a more natural geometric space for the problem at hand.

## The Standard Gradient Descent

Recall that gradient descent updates parameters as follows:

$$x_{t+1} = x_t - \eta \nabla f(x_t)$$

where $\eta$ is the learning rate and $\nabla f(x_t)$ is the gradient of the objective function at $x_t$.

We can rewrite this as a two-step process:

$$x_{t+1} = \arg\min_x \left\{ \langle \nabla f(x_t), x \rangle + \frac{1}{2\eta} \|x - x_t\|^2 \right\}$$

The first term is a linear approximation of the function, while the second term is a **proximity term** that keeps us close to the previous iterate.

## Mirror Descent Framework

Mirror descent generalizes this by replacing the Euclidean distance with a **Bregman divergence** based on a convex function $\psi$ called the **mirror map**:

$$D_\psi(x, y) = \psi(x) - \psi(y) - \langle \nabla \psi(y), x - y \rangle$$

The mirror descent update becomes:

$$x_{t+1} = \arg\min_x \left\{ \langle \nabla f(x_t), x \rangle + \frac{1}{\eta} D_\psi(x, x_t) \right\}$$

### The Dual Space Perspective

A key insight is to work in the **dual space**. Define:

$$\theta_t = \nabla \psi(x_t)$$

This maps points from the primal space to the dual space. The mirror descent update in dual space is simply:

$$\theta_{t+1} = \theta_t - \eta \nabla f(x_t)$$

Then we map back to the primal space:

$$x_{t+1} = \nabla \psi^*(\theta_{t+1})$$

where $\psi^*$ is the **convex conjugate** (Fenchel dual) of $\psi$.

## Example: Entropic Mirror Map

For problems on the probability simplex (where $x \geq 0$ and $\sum_i x_i = 1$), a natural choice is the **negative entropy**:

$$\psi(x) = \sum_{i=1}^n x_i \log x_i$$

The Bregman divergence associated with this mirror map is the **KL divergence**:

$$D_\psi(x, y) = \sum_{i=1}^n x_i \log\frac{x_i}{y_i}$$

The mirror descent update becomes:

$$x_{t+1,i} = \frac{x_{t,i} \exp(-\eta \nabla_i f(x_t))}{\sum_j x_{t,j} \exp(-\eta \nabla_j f(x_t))}$$

This is known as **exponentiated gradient** or **multiplicative weights update**.

## Why Mirror Descent?

### 1. Constraint Handling

Mirror descent naturally handles constraints by choosing an appropriate mirror map. For example:
- **Probability simplex**: Use negative entropy
- **Positive orthant**: Use logarithmic barrier
- **Unit sphere**: Use spherical geometry

### 2. Geometry-Aware Updates

Different geometries require different notions of distance. Euclidean distance isn't always appropriate:
- For probability distributions, KL divergence is more natural
- For positive definite matrices, log-determinant divergence works better

### 3. Adaptive Learning Rates

Mirror descent can be viewed as using adaptive, coordinate-wise learning rates that depend on the local geometry.

## Convergence Analysis

For convex functions, mirror descent achieves the following regret bound:

$$\sum_{t=1}^T f(x_t) - T f(x^*) \leq \frac{D_\psi(x^*, x_1)}{\eta} + \frac{\eta}{2} \sum_{t=1}^T \|\nabla f(x_t)\|_*^2$$

where $\|\cdot\|_*$ is the dual norm with respect to the local norm induced by $\psi$.

Optimizing over $\eta$ gives the convergence rate:

$$\text{Regret} = O\left(\sqrt{T}\right)$$

## Practical Applications

Mirror descent and its variants are widely used in:

### Online Learning
The multiplicative weights algorithm is fundamental in online learning and game theory.

### Sparse Optimization
Using appropriate mirror maps can encourage sparsity in the solution.

### Non-Euclidean Optimization
Problems on manifolds or constrained spaces benefit from geometry-aware updates.

### Deep Learning
Natural gradient descent can be viewed as a form of mirror descent with the Fisher information metric.

## Example: Online Learning with Expert Advice

Consider the problem of aggregating expert predictions. At each round $t$:
1. Choose a weight distribution $w_t$ over $n$ experts
2. Observe loss vector $\ell_t \in [0,1]^n$
3. Suffer loss $\langle w_t, \ell_t \rangle$

Using mirror descent with negative entropy:

$$w_{t+1,i} = \frac{w_{t,i} \exp(-\eta \ell_{t,i})}{\sum_j w_{t,j} \exp(-\eta \ell_{t,j})}$$

This achieves regret:

$$\sum_{t=1}^T \langle w_t, \ell_t \rangle - \min_i \sum_{t=1}^T \ell_{t,i} \leq \frac{\log n}{\eta} + \frac{\eta T}{2}$$

Choosing $\eta = \sqrt{\frac{2\log n}{T}}$ gives regret $O(\sqrt{T \log n})$.

## Mirror Descent vs. Proximal Methods

Mirror descent is closely related to proximal gradient methods. The proximal operator:

$$\text{prox}_{\eta h}(x) = \arg\min_z \left\{ h(z) + \frac{1}{2\eta}\|z - x\|^2 \right\}$$

can be generalized using Bregman divergence:

$$\text{prox}_{\eta h}^{\psi}(x) = \arg\min_z \left\{ h(z) + \frac{1}{\eta}D_\psi(z, x) \right\}$$

This is called the **Bregman proximal operator**.

## Implementation Considerations

When implementing mirror descent:

1. **Choose an appropriate mirror map**: The geometry should match your constraint set
2. **Compute the dual mapping**: You need efficient ways to compute $\nabla \psi^*$
3. **Set the learning rate**: Use line search or adaptive methods
4. **Handle numerical stability**: Log-sum-exp tricks for entropy-based methods

## Conclusion

Mirror descent provides a principled framework for optimization that goes beyond Euclidean geometry. By choosing appropriate mirror maps, we can design algorithms that naturally respect the structure of our problem, leading to better convergence and more intuitive updates.

Key takeaways:
- Mirror descent generalizes gradient descent using Bregman divergence
- The dual space perspective simplifies the algorithm
- Choosing the right geometry can significantly improve performance
- Applications range from online learning to deep learning

For further reading, I recommend exploring natural gradient descent, proximal methods, and information geometry.

