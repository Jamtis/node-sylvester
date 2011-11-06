
node-sylvester
==============

node.js implementation of James Coglan's "Sylvester" matrix math library.
The original project can be found at http://sylvester.jcoglan.com/

This project is maintained by Chris Umbel (http://www.chrisumbel.com)

Usage
=====

Below is a basic illustration of standard matrix/vector math using sylvester.
This documentation is rather incomplete and for further details please consult
[the official sylvester API documentation](http://sylvester.jcoglan.com/docs)
at [http://sylvester.jcoglan.com/docs](http://sylvester.jcoglan.com/docs).

Vectors
-------
    require('sylvester');

create two vectors

    var a = $V([1, 2, 3]);
    var b = $V([2, 3, 4]);

compute the dot product

    var r = a.dot(b);

add two vectors

    var c = a.add(b);

multiply by scalar

    var d = a.x(2);

Matrices
--------
    require('sylvester');

create two matrices

    var A = $M([[1, 2], [3, 4]]);
    var B = $M([[1, 2, 3], [4, 5, 6]]);

multiply the matrices

    var C = A.x(B);

transpose a matrix

    var B_T = B.transpose();
    // B is 2x3, B_T is 3x2

License
=======

This project is released under The MIT License

Copyright (c) 2011, Chris Umbel, James Coglan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.