// Copyright (c) 2011, Chris Umbel, James Coglan
import { Vector } from './vector';
import { Matrix } from './matrix';
import { Plane } from './plane';
import { Sylvester, DimensionalityMismatchError } from './sylvester';

// Line class - depends on Vector, and some methods require Matrix and Plane.
export class Line {
  /**
   * Creates a new line from the anchor in the given direction.
   * @param {Vector|number[]} anchor
   * @param {Vector|number[]} direction
   */
  constructor(anchor, direction) {
    anchor = new Vector(anchor).to3D();
    direction = new Vector(direction).to3D();
    const mod = direction.modulus();
    if (mod === 0) {
      throw new DimensionalityMismatchError(`Cannot create a line with a zero direction`);
    }

    this.anchor = anchor;
    this.direction = new Vector([
      direction.elements[0] / mod,
      direction.elements[1] / mod,
      direction.elements[2] / mod
    ]);

    return this;
  }

  /**
   * Returns true if the argument occupies the same space as the line
   * @param {?Number} epsilon Precision at which to calculate equality
   * @param {Line} line
   * @returns {Boolean}
   */
  eql(line, epsilon = Sylvester.precision) {
    return (this.isParallelTo(line, epsilon) && this.contains(line.anchor, epsilon));
  }

  /**
   * Returns the result of translating the line by the given vector/array
   * @param {Vector|number} vector
   * @returns {Line}
   */
  translate(vector) {
    const V = Vector.toElements(vector, 3);
    return new Line([
      this.anchor.elements[0] + V[0],
      this.anchor.elements[1] + V[1],
      this.anchor.elements[2] + V[2]
    ], this.direction);
  }

  /**
   * Returns true if the line is parallel to the argument. Here, 'parallel to'
   * means that the argument's direction is either parallel or antiparallel to
   * the line's own direction. A line is parallel to a plane if the two do not
   * have a unique intersection.
   * @param {Line|Plane} obj
   * @param {?Number} epsilon Precision at which to calculate angle equality
   * @returns {Boolean}
   */
  isParallelTo(obj, epsilon = Sylvester.precision) {
    if (obj instanceof Plane || obj instanceof Segment) {
      return obj.isParallelTo(this, epsilon);
    }
    const theta = this.direction.angleFrom(obj.direction);
    return (Math.abs(theta) <= epsilon || Math.abs(theta - Math.PI) <= epsilon);
  }

  /**
   * Returns the line's perpendicular distance from the argument,
   * which can be a point, a line or a plane
   * @param {Vector|Line|Plane} obj
   * @returns {Number}
   */
  distanceFrom(obj) {
    if (obj instanceof Plane) {
      return obj.distanceFrom(this);
    }

    if (obj instanceof Line) {
      if (this.isParallelTo(obj)) {
        return this.distanceFrom(obj.anchor);
      }

      const N = this.direction.cross(obj.direction).toUnitVector().elements;
      const A = this.anchor.elements;
      const B = obj.anchor.elements;
      return Math.abs(
        ((A[0] - B[0]) * N[0]) +
        ((A[1] - B[1]) * N[1]) +
        ((A[2] - B[2]) * N[2])
      );
    }


    // todo: a more optimized vector algorithm, perhaps:
    // const P = new Vector(obj).to3D();
    // const A = this.anchor;
    // const aSubP = A.subtract(P);
    // return aSubP.subtract(this.direction.multiply(aSubP.dot(this.direction))).modulus();

    // obj is a point
    const P = Vector.toElements(obj, 3);
    const A = this.anchor.elements;
    const D = this.direction.elements;
    const PA1 = P[0] - A[0];
    const PA2 = P[1] - A[1];
    const PA3 = P[2] - A[2];
    const modPA = Math.sqrt((PA1 * PA1) + (PA2 * PA2) + (PA3 * PA3));
    if (modPA === 0) {
      return 0;
    }

    // Assumes direction vector is normalized
    const cosTheta = ((PA1 * D[0]) + (PA2 * D[1]) + (PA3 * D[2])) / modPA;
    const sin2 = 1 - (cosTheta * cosTheta);
    return Math.abs(modPA * Math.sqrt(sin2 < 0 ? 0 : sin2));
  }

  /**
   * Returns true iff the argument is a point on the line, or if the argument
   * is a line segment lying within the receiver
   * @param {Line|Vector} obj
   * @param {Number} epsilon epsilon for returning object distance
   * @returns {Boolean}
   */
  contains(obj, epsilon = Sylvester.precision) {
    if (obj instanceof Segment) {
      return this.contains(obj.start) && this.contains(obj.end);
    }

    const dist = this.distanceFrom(obj);
    return (dist !== null && dist <= epsilon);
  }

  /**
   * Returns the distance from the anchor of the given point. Negative values
   * are returned for points that are in the opposite direction to the line's
   * direction from the line's anchor point.
   * @param {Vector} point
   * @returns {?Number} A number or null if the point is not on the line
   */
  positionOf(point) {
    if (!this.contains(point)) {
      return null;
    }
    const P = Vector.toElements(point, 3);
    const A = this.anchor.elements;
    const D = this.direction.elements;
    return ((P[0] - A[0]) * D[0]) +
      ((P[1] - A[1]) * D[1]) +
      ((P[2] - A[2]) * D[2]);
  }

  /**
   * Returns whether the line lies in the given plan.
   * @param {Plane} plane
   * @returns {Boolean}
   */
  liesIn(plane) {
    return plane.contains(this);
  }

  /**
   * Returns true iff the line has a unique point of intersection with the argument
   * @param {Plane|Line} obj
   * @param {?Number} epsilon Precision at which to calculate distance
   * @returns {Boolean}
   */
  intersects(obj, epsilon = Sylvester.precision) {
    if (obj instanceof Plane) {
      return obj.intersects(this);
    }
    return (!this.isParallelTo(obj) && this.distanceFrom(obj) <= epsilon);
  }

  /**
   * Returns the unique intersection point with the argument, if one exists,
   * or null.
   * @param {Plane|Line|Segment} obj
   * @returns {?Vector}
   */
  intersectionWith(obj) {
    if (obj instanceof Plane || obj instanceof Segment) {
      return obj.intersectionWith(this);
    }
    if (!this.intersects(obj)) {
      return null;
    }
    const P = this.anchor.elements;
    const X = this.direction.elements;
    const Q = obj.anchor.elements;
    const Y = obj.direction.elements;
    const X1 = X[0];
    const X2 = X[1];
    const X3 = X[2];
    const Y1 = Y[0];
    const Y2 = Y[1];
    const Y3 = Y[2];
    const PsubQ1 = P[0] - Q[0];
    const PsubQ2 = P[1] - Q[1];
    const PsubQ3 = P[2] - Q[2];
    const XdotQsubP = (-X1 * PsubQ1) - (X2 * PsubQ2) - (X3 * PsubQ3);
    const YdotPsubQ = (Y1 * PsubQ1) + (Y2 * PsubQ2) + (Y3 * PsubQ3);
    const XdotX = (X1 * X1) + (X2 * X2) + (X3 * X3);
    const YdotY = (Y1 * Y1) + (Y2 * Y2) + (Y3 * Y3);
    const XdotY = (X1 * Y1) + (X2 * Y2) + (X3 * Y3);
    const k = ((XdotQsubP * YdotY / XdotX) + (XdotY * YdotPsubQ)) / (YdotY - (XdotY * XdotY));

    return new Vector([P[0] + (k * X1), P[1] + (k * X2), P[2] + (k * X3)]);
  }

  /**
   * Returns the point on the line that is closest to the given
   * point or line/line segment.
   * @param {Line|Plane|Segment|Vector} obj
   * @returns {?Vector} a vector, or null if this is parallel to the object
   */
  pointClosestTo(obj) {
    if (obj instanceof Plane) {
      return this.intersectionWith(obj);
    }

    if (obj instanceof Segment) {
      // obj is a line segment
      const p = obj.pointClosestTo(this);
      return p ? this.pointClosestTo(p) : null;
    }

    if (obj instanceof Line) {
      if (this.intersects(obj)) {
        return this.intersectionWith(obj);
      }
      if (this.isParallelTo(obj)) {
        return null;
      }
      const D = this.direction.elements;
      const E = obj.direction.elements;
      const D1 = D[0];
      const D2 = D[1];
      const D3 = D[2];
      const E1 = E[0];
      const E2 = E[1];
      const E3 = E[2];

      // Create plane containing obj and the shared normal and intersect this with it
      // Thank you: https://web.archive.org/web/20100222230012/http://www.cgafaq.info/wiki/Line-line_distance
      const x = (D3 * E1) - (D1 * E3);
      const y = (D1 * E2) - (D2 * E1);
      const z = (D2 * E3) - (D3 * E2);
      const N = [(x * E3) - (y * E2), (y * E1) - (z * E3), (z * E2) - (x * E1)];
      const P = Plane.create(obj.anchor, N);
      return P.intersectionWith(this);
    }

    // obj is a point
    obj = new Vector(obj).to3D();
    const P = obj.elements;
    if (this.contains(obj)) {
      return obj;
    }
    const A = this.anchor.elements;
    const D = this.direction.elements;
    const D1 = D[0];
    const D2 = D[1];
    const D3 = D[2];
    const A1 = A[0];
    const A2 = A[1];
    const A3 = A[2];
    const x = (D1 * (P[1] - A2)) - (D2 * (P[0] - A1));
    const y = (D2 * ((P[2] || 0) - A3)) - (D3 * (P[1] - A2));
    const z = (D3 * (P[0] - A1)) - (D1 * ((P[2] || 0) - A3));
    const V = new Vector([(D2 * x) - (D3 * z), (D3 * y) - (D1 * x), (D1 * z) - (D2 * y)]);
    const k = this.distanceFrom(P) / V.modulus();
    return new Vector([
      P[0] + (V.elements[0] * k),
      P[1] + (V.elements[1] * k),
      (P[2] || 0) + (V.elements[2] * k)
    ]);
  }

  /**
   * Returns a copy of the line rotated by t radians about the given line
   * Works by finding the argument's closest point to this line's anchor point
   * (call this C) and rotating the anchor about C. Also rotates the line's
   * direction about the argument's. Be careful with this - the rotation
   * axis' direction affects the outcome!
   * @param {Number} theta rotation in radians
   * @param {Line} line axis to rotate around or point (for 2D rotation)
   * @returns {Line}
   */
  rotate(theta, line) {
    // If we're working in 2D
    if (!(line instanceof Line)) {
      line = new Line(line, Vector.k);
    }
    const R = Matrix.Rotation(theta, line.direction).elements;
    const C = line.pointClosestTo(this.anchor).elements;
    const A = this.anchor.elements;
    const D = this.direction.elements;
    const C1 = C[0];
    const C2 = C[1];
    const C3 = C[2];
    const A1 = A[0];
    const A2 = A[1];
    const A3 = A[2];
    const x = A1 - C1;
    const y = A2 - C2;
    const z = A3 - C3;
    return new Line([
      C1 + (R[0][0] * x) + (R[0][1] * y) + (R[0][2] * z),
      C2 + (R[1][0] * x) + (R[1][1] * y) + (R[1][2] * z),
      C3 + (R[2][0] * x) + (R[2][1] * y) + (R[2][2] * z)
    ], [
      (R[0][0] * D[0]) + (R[0][1] * D[1]) + (R[0][2] * D[2]),
      (R[1][0] * D[0]) + (R[1][1] * D[1]) + (R[1][2] * D[2]),
      (R[2][0] * D[0]) + (R[2][1] * D[1]) + (R[2][2] * D[2])
    ]);
  }

  /**
   * Returns a copy of the line with its direction vector reversed.
   * Useful when using lines for rotations.
   * @returns {Line}
   */
  reverse() {
    return new Line(this.anchor, this.direction.x(-1));
  }

  /**
   * Returns the line's reflection in the given point or line.
   * @param {Plane|Line|Vector} obj
   * @returns {Line}
   */
  reflectionIn(obj) {
    if (obj instanceof Plane) {
      // obj is a plane
      const A = this.anchor.elements;

      const D = this.direction.elements;
      const A1 = A[0];
      const A2 = A[1];
      const A3 = A[2];
      const D1 = D[0];
      const D2 = D[1];
      const D3 = D[2];
      const newA = this.anchor.reflectionIn(obj).elements;

      // Add the line's direction vector to its anchor, then mirror that in the plane
      const AD1 = A1 + D1;

      const AD2 = A2 + D2;
      const AD3 = A3 + D3;
      const Q = obj.pointClosestTo([AD1, AD2, AD3]).elements;
      const newD = [
        Q[0] + (Q[0] - AD1) - newA[0],
        Q[1] + (Q[1] - AD2) - newA[1],
        Q[2] + (Q[2] - AD3) - newA[2]
      ];
      return new Line(newA, newD);
    }
    if (obj instanceof Line) {
      // obj is a line - reflection obtained by rotating PI radians about obj
      return this.rotate(Math.PI, obj);
    }

    // obj is a point - just reflect the line's anchor in it
    const P = Vector.toElements(obj, 3);
    return new Line(this.anchor.reflectionIn([P[0], P[1], P[2]]), this.direction);
  }
}

/**
 * Represents a line in 3D (or 2D) space between two points.
 */
export class Segment {
  /**
   * Creates a new line segment.
   * @param {Vector} startPoint
   * @param {Vector} endPoint
   */
  constructor(startPoint, endPoint) {
    startPoint = new Vector(startPoint).to3D();
    endPoint = new Vector(endPoint).to3D();
    this.line = new Line(startPoint, endPoint.subtract(startPoint));
    this.start = startPoint;
    this.end = endPoint;
  }

  /**
   * Returns true iff the line segment is equal to the argument
   * @param {Segment} segment
   * @returns {Boolean}
   */
  eql(segment) {
    return (this.start.eql(segment.start) && this.end.eql(segment.end)) ||
        (this.start.eql(segment.end) && this.end.eql(segment.start));
  }

  /**
   * Returns the length of the line segment.
   * @returns {Number}
   */
  length() {
    const A = this.start.elements;
    const B = this.end.elements;
    const C1 = B[0] - A[0];
    const C2 = B[1] - A[1];
    const C3 = B[2] - A[2];
    return Math.sqrt((C1 * C1) + (C2 * C2) + (C3 * C3));
  }

  /**
   * Returns the line segment as a vector equal to its
   * end point relative to its endpoint.
   * @returns {Vector}
   */
  toVector() {
    const A = this.start.elements;
    const B = this.end.elements;
    return new Vector([B[0] - A[0], B[1] - A[1], B[2] - A[2]]);
  }

  /**
   * Returns the segment's midpoint as a vector
   * @returns {Vector}
   */
  midpoint() {
    const A = this.start.elements;
    const B = this.end.elements;
    return new Vector([(B[0] + A[0]) / 2, (B[1] + A[1]) / 2, (B[2] + A[2]) / 2]);
  }

  /**
   * Returns the plane that bisects the segment
   * @returns {Plane}
   */
  bisectingPlane() {
    return Plane.create(this.midpoint(), this.toVector());
  }

  /**
   * Returns the result of translating the line by the given vector/array.
   * @param {Vector|number[]} vector
   */
  translate(vector) {
    const V = Vector.toElements(vector, 3);
    const S = this.start.elements;
    const E = this.end.elements;
    return new Segment(
      [S[0] + V[0], S[1] + V[1], S[2] + V[2]],
      [E[0] + V[0], E[1] + V[1], E[2] + V[2]]
    );
  }

  /**
   * Returns true iff the line segment is parallel to the argument. It simply forwards
   * @param {Line|Plane} obj
   * @param {?Number} epsilon Precision at which to calculate angle equality
   * @returns {Boolean}
   */
  isParallelTo(obj, epsilon = Sylvester.precision) {
    return this.line.isParallelTo(obj, epsilon);
  }

  /**
   * Returns the distance between the argument and the line segment's closest point to the argument
   * @param {Vector|Line|Plane} obj
   */
  distanceFrom(obj) {
    if (obj instanceof Vector) {
      obj = obj.to3D();
    }
    const P = this.pointClosestTo(obj);
    return (P === null) ? null : P.distanceFrom(obj);
  }

  /**
   * Returns true iff the given point lies on the segment
   * @param {Segment|Vector} obj
   */
  contains(obj) {
    if (obj instanceof Segment) {
      return this.contains(obj.start) && this.contains(obj.end);
    }

    const P = Vector.toElements(obj, 3);
    if (this.start.eql(P)) {
      return true;
    }
    const S = this.start.elements;
    const V = new Vector([S[0] - P[0], S[1] - P[1], S[2] - P[2]]);
    const vect = this.toVector();
    return V.isAntiparallelTo(vect) && V.modulus() <= vect.modulus();
  }

  /**
   * Returns true iff the line segment intersects the argument
   * @param {Line|Segment|Plane} obj
   * @returns {Boolean}
   */
  intersects(obj) {
    return (this.intersectionWith(obj) !== null);
  }

  /**
   * Returns true iff the line segment intersects the argument
   * @param {Line|Segment|Plane} obj
   * @returns {Vector|null} the point, or null if there is no intersection
   */
  intersectionWith(obj) {
    if (!this.line.intersects(obj)) {
      return null;
    }
    const P = this.line.intersectionWith(obj);
    return (this.contains(P) ? P : null);
  }

  /**
   * Returns the point on the line segment closest to the given object
   * @param {Plane|Segment|Vector} obj
   * @returns {Vector|null} The vector, or null if the object is parallel to the segment.
   */
  pointClosestTo(obj) {
    if (obj instanceof Plane) {
      // obj is a plane
      const V = this.line.intersectionWith(obj);
      if (V === null) {
        return null;
      }
      return this.pointClosestTo(V);
    }

    // obj is a line (segment) or point
    const P = this.line.pointClosestTo(obj);
    if (P === null) {
      return null;
    }

    if (this.contains(P)) {
      return P;
    }

    return this.line.positionOf(P) < 0 ? this.start : this.end;
  }
}

// Axes
Line.X = new Line(Vector.Zero(3), Vector.i);
Line.Y = new Line(Vector.Zero(3), Vector.j);
Line.Z = new Line(Vector.Zero(3), Vector.k);
Line.Segment = Segment;
