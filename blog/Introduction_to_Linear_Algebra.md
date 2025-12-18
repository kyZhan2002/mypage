---
layout: post
title: "Introduction to Linear Algebra: Key Concepts and Formulas"
date: 2025-02-11
categories: blog
permalink: /blog/Introduction_to_Linear_Algebra
---

Linear algebra is a fundamental branch of mathematics that deals with vector spaces, linear transformations, and systems of linear equations. In this post, I'll introduce some key concepts and formulas that form the foundation of this beautiful subject.

## Vectors and Vector Spaces

A **vector** in $\mathbb{R}^n$ is an ordered $n$-tuple of real numbers. We can represent a vector $\mathbf{v}$ as:

$$\mathbf{v} = \begin{pmatrix} v_1 \\ v_2 \\ \vdots \\ v_n \end{pmatrix}$$

The **dot product** (or inner product) of two vectors $\mathbf{u}$ and $\mathbf{v}$ is defined as:

$$\mathbf{u} \cdot \mathbf{v} = \sum_{i=1}^{n} u_i v_i = u_1 v_1 + u_2 v_2 + \cdots + u_n v_n$$

The **magnitude** (or norm) of a vector is given by:

$$\|\mathbf{v}\| = \sqrt{\mathbf{v} \cdot \mathbf{v}} = \sqrt{v_1^2 + v_2^2 + \cdots + v_n^2}$$

## Matrices and Matrix Operations

A **matrix** $A$ of size $m \times n$ is a rectangular array of numbers:

$$A = \begin{pmatrix}
a_{11} & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{m1} & a_{m2} & \cdots & a_{mn}
\end{pmatrix}$$

### Matrix Multiplication

If $A$ is an $m \times n$ matrix and $B$ is an $n \times p$ matrix, then their product $C = AB$ is an $m \times p$ matrix where:

$$c_{ij} = \sum_{k=1}^{n} a_{ik} b_{kj}$$

### Determinant

For a $2 \times 2$ matrix, the determinant is:

$$\det(A) = \det\begin{pmatrix} a & b \\ c & d \end{pmatrix} = ad - bc$$

For a $3 \times 3$ matrix, we use the formula:

$$\det(A) = a_{11}(a_{22}a_{33} - a_{23}a_{32}) - a_{12}(a_{21}a_{33} - a_{23}a_{31}) + a_{13}(a_{21}a_{32} - a_{22}a_{31})$$

## Eigenvalues and Eigenvectors

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

## Systems of Linear Equations

A system of $m$ linear equations in $n$ unknowns can be written in matrix form as:

$$A\mathbf{x} = \mathbf{b}$$

where $A$ is an $m \times n$ coefficient matrix, $\mathbf{x}$ is the vector of unknowns, and $\mathbf{b}$ is the constant vector.

### Cramer's Rule

For a system of $n$ equations in $n$ unknowns where $\det(A) \neq 0$, Cramer's rule states that:

$$x_i = \frac{\det(A_i)}{\det(A)}$$

where $A_i$ is the matrix formed by replacing the $i$-th column of $A$ with the vector $\mathbf{b}$.

## Applications

Linear algebra has numerous applications across various fields:

- **Machine Learning**: Principal Component Analysis (PCA) uses eigenvalue decomposition to reduce dimensionality
- **Computer Graphics**: Transformations like rotation and scaling are represented as matrices
- **Quantum Mechanics**: Quantum states are represented as vectors in Hilbert spaces
- **Data Analysis**: Singular Value Decomposition (SVD) is used for matrix factorization

## Conclusion

This brief introduction only scratches the surface of linear algebra. The beauty of this subject lies in its elegant abstractions and powerful applications. Whether you're working with data, graphics, or theoretical physics, understanding these fundamental concepts will serve you well.

For those interested in diving deeper, I recommend exploring topics like:
- Vector spaces and subspaces
- Linear transformations
- Orthogonality and orthonormal bases
- Singular Value Decomposition (SVD)
- Matrix decompositions (LU, QR, Cholesky)

Happy learning!

