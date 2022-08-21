// @ts-ignore
export function evalB64(str) {
    var e, r, a, n, t, c, s, o, i, f, b, k;

    function u() {
        this.table = new Uint16Array(16), this.t = new Uint16Array(288)
    }

    function w(e, r) {
        this.source = e, this.sourceIndex = 0, this.tag = 0, this.o = 0, this.i = r, this.k = 0, this.u = new u, this.l = new u
    }

    function l(e, r, a, n) {
        var t, c;
        for (t = 0; t < a; ++t) e[t] = 0;
        for (t = 0; t < 30 - a; ++t) e[t + a] = t / a | 0;
        for (c = n, t = 0; t < 30; ++t) r[t] = c, c += 1 << e[t]
    }

    function h(e, r, a, n) {
        var t, c;
        for (t = 0; t < 16; ++t) e.table[t] = 0;
        for (t = 0; t < n; ++t) e.table[r[a + t]]++;
        for (e.table[0] = 0, c = 0, t = 0; t < 16; ++t) k[t] = c, c += e.table[t];
        for (t = 0; t < n; ++t) r[a + t] && (e.t[k[r[a + t]]++] = t)
    }

    function A(e) {
        e.o-- || (e.tag = e.source[e.sourceIndex++], e.o = 7);
        var r = 1 & e.tag;
        return e.tag >>>= 1, r
    }

    function y(e, r, a) {
        if (!r) return a;
        for (; e.o < 24;) e.tag |= e.source[e.sourceIndex++] << e.o, e.o += 8;
        var n = e.tag & 65535 >>> 16 - r;
        return e.tag >>>= r, e.o -= r, n + a
    }

    function d(e, r) {
        for (var a, n, t, c; e.o < 24;) e.tag |= e.source[e.sourceIndex++] << e.o, e.o += 8;
        a = 0, n = 0, t = 0, c = e.tag;
        do {
            n = 2 * n + (1 & c), c >>>= 1, ++t, a += r.table[t], n -= r.table[t]
        } while (n >= 0);
        return e.tag = c, e.o -= t, r.t[a + n]
    }

    function v(e, r, a) {
        var n, t, c, s, o, k, u = y(e, 5, 257),
            w = y(e, 5, 1),
            l = y(e, 4, 4);
        for (n = 0; n < 19; ++n) b[n] = 0;
        for (n = 0; n < l; ++n) s = y(e, 3, 0), b[i[n]] = s;
        for (h(f, b, 0, 19), t = 0; t < u + w;) switch (o = d(e, f)) {
            case 16:
                for (k = b[t - 1], c = y(e, 2, 3); c; --c) b[t++] = k;
                break;
            case 17:
                for (c = y(e, 3, 3); c; --c) b[t++] = 0;
                break;
            case 18:
                for (c = y(e, 7, 11); c; --c) b[t++] = 0;
                break;
            default:
                b[t++] = o
        }
        h(r, b, 0, u), h(a, b, u, w)
    }

    function U(r, a, n) {
        for (var i, f, b, k, u;;) {
            if (256 === (i = d(r, a))) return e;
            if (i < 256) r.i[r.k++] = i;
            else
                for (f = y(r, t[i -= 257], c[i]), b = d(r, n), u = k = r.k - y(r, s[b], o[b]); u < k + f; ++u) r.i[r.k++] = r.i[u]
        }
    }

    function E(a) {
        for (var n, t; a.o > 8;) a.sourceIndex--, a.o -= 8;
        if ((n = 256 * (n = a.source[a.sourceIndex + 1]) + a.source[a.sourceIndex]) !== (65535 & ~(256 * a.source[a.sourceIndex + 3] + a.source[a.sourceIndex + 2]))) return r;
        for (a.sourceIndex += 4, t = n; t; --t) a.i[a.k++] = a.source[a.sourceIndex++];
        return a.o = 0, e
    }
    e = 0, r = -3, a = new u, n = new u, t = new Uint8Array(30), c = new Uint16Array(30), s = new Uint8Array(30), o = new Uint16Array(30), i = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), f = new u, b = new Uint8Array(320), k = new Uint16Array(16),
        function(e, r) {
            var a;
            for (a = 0; a < 7; ++a) e.table[a] = 0;
            for (e.table[7] = 24, e.table[8] = 152, e.table[9] = 112, a = 0; a < 24; ++a) e.t[a] = 256 + a;
            for (a = 0; a < 144; ++a) e.t[24 + a] = a;
            for (a = 0; a < 8; ++a) e.t[168 + a] = 280 + a;
            for (a = 0; a < 112; ++a) e.t[176 + a] = 144 + a;
            for (a = 0; a < 5; ++a) r.table[a] = 0;
            for (r.table[5] = 32, a = 0; a < 32; ++a) r.t[a] = a
        }(a, n), l(t, c, 4, 3), l(s, o, 2, 1), t[28] = 0, c[28] = 258,
        function(t, c = {}) {
            const s = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : c;
            let o = s;
            const i = "undefined" != typeof undefined ? function(){} : function() {},
                f = function(e, r = 0) {
                    var a, n, t, c, s, o, i = str.replace(/[^A-Za-z0-9+/]/g, ""),
                        f = i.length,
                        b = r ? Math.ceil((3 * f + 1 >> 2) / r) * r : 3 * f + 1 >> 2,
                        k = new Uint8Array(b);
                    for (t = 0, c = 0, s = 0; s < f; s++)
                        if (n = 3 & s, t |= ((o = i.charCodeAt(s)) > 64 && o < 91 ? o - 65 : o > 96 && o < 123 ? o - 71 : o > 47 && o < 58 ? o + 4 : 43 === o ? 62 : 47 === o ? 63 : 0) << 6 * (3 - n), 3 === n || f - s == 1) {
                            for (a = 0; a < 3 && c < b; a++, c++) k[c] = t >>> (16 >>> a & 24) & 255;
                            t = 0
                        } return k
                }(),
                b = !!f[0],
                k = b ? f[1] | f[2] << 8 | f[3] << 16 | f[4] << 24 : f.length,
                u = b ? new Uint8Array(k) : new Uint8Array(f.buffer, 5, f.length - 5);
            b && function(t, c) {
                var s, o, i = new w(t, c);
                do {
                    switch (s = A(i), y(i, 2, 0)) {
                        case 0:
                            o = E(i);
                            break;
                        case 1:
                            o = U(i, a, n);
                            break;
                        case 2:
                            v(i, i.u, i.l), o = U(i, i.u, i.l);
                            break;
                        default:
                            o = r
                    }
                    if (o !== e) throw new Error("Data error")
                } while (!s);
                i.k < i.i.length ? "function" == typeof i.i.slice ? i.i.slice(0, i.k) : i.i.subarray(0, i.k) : i.i
            }(new Uint8Array(f.buffer, 5, f.length - 5), u);
            let l = 0,
                h = {},
                d = [];
            const g = [],
                p = [],
                j = [];
            let O = 0,
                T = null,
                R = null,
                q = [],
                G = null;
            const H = "_$EXPORTS".slice(),
                P = "require".slice();
            c[H] = {}, c[P] = i;
            const S = new Float64Array(1),
                m = new Uint8Array(S.buffer);

            function x() {
                let e = 0,
                    r = 0,
                    a = 0;
                for (; a = u[l++], e |= (127 & a) << r, 0 != (128 & a);) r += 7;
                return e
            }

            function C() {
                return u[l++] | u[l++] << 8 | u[l++] << 16 | u[l++] << 24
            }

            function D() {
                const e = x();
                let r = "";
                for (let a = 0; a < e; a++) r += String.fromCharCode(u[l++]);
                return r
            }

            function F(e, r) {
                const a = h;
                return function n() {
                    const t = O,
                        c = {};
                    O = e;
                    const s = h;
                    h = c, h[e] = {};
                    const i = j[e],
                        f = i.length;
                    for (let e = 0; e < f; e++) {
                        const r = i[e];
                        let n = a[r];
                        c[r] = n
                    }
                    const b = d,
                        k = l,
                        u = T,
                        w = R,
                        A = o,
                        y = q;
                    let v = null,
                        U = null;
                    d = [], q = [], l = r, T = n, R = arguments, o = this;
                    try {
                        v = I()
                    } catch (e) {
                        if (q.length) {
                            const r = q.pop();
                            l = r, G = e, v = I()
                        } else U = e
                    }
                    if (q = y, l = k, d = b, T = u, h = s, O = t, R = w, o = A, U) throw U;
                    return v
                }
            }

            function I() {
                for (;;) {
                    const e = u[l++];
                    switch (e) {
                        case 46: {
                            const e = x(),
                                r = x();
                            Object.defineProperty(h[r], e, {
                                get: () => T,
                                set() {}
                            });
                            break
                        }
                        case 61:
                            h[O][x()] = R;
                            break;
                        case 22:
                            d[u[l++]] = d[u[l++]] instanceof d[u[l++]];
                            break;
                        case 23:
                            d[u[l++]] = d[u[l++]] in d[u[l++]];
                            break;
                        case 0:
                            d[u[l++]] = x();
                            break;
                        case 51:
                            d[u[l++]] = u[l++] ? ++h[x()][x()] : h[x()][x()]++;
                            break;
                        case 52:
                            d[u[l++]] = u[l++] ? --h[x()][x()] : h[x()][x()]--;
                            break;
                        case 1:
                            d[u[l++]] = (m[0] = u[l++], m[1] = u[l++], m[2] = u[l++], m[3] = u[l++], m[4] = u[l++], m[5] = u[l++], m[6] = u[l++], m[7] = u[l++], S[0]);
                            break;
                        case 49: {
                            const e = x(),
                                r = x();
                            h[O][r] = R[e];
                            break
                        }
                        case 5:
                            d[u[l++]] = d[u[l++]];
                            break;
                        case 53:
                            d[u[l++]] = o;
                            break;
                        case 41:
                            d[u[l++]] = F(x(), C());
                            break;
                        case 67:
                            d[u[l++]] = u[l++] ? ++d[u[l++]][d[u[l++]]] : d[u[l++]][d[u[l++]]]++;
                            break;
                        case 68:
                            d[u[l++]] = u[l++] ? --d[u[l++]][d[u[l++]]] : d[u[l++]][d[u[l++]]]--;
                            break;
                        case 2:
                            d[u[l++]] = g[x()];
                            break;
                        case 57:
                            d[u[l++]] = !d[u[l++]];
                            break;
                        case 70:
                            d[u[l++]] = void d[u[l++]];
                            break;
                        case 58:
                            d[u[l++]] = ~d[u[l++]];
                            break;
                        case 59:
                            d[u[l++]] = -d[u[l++]];
                            break;
                        case 60:
                            d[u[l++]] = typeof d[u[l++]];
                            break;
                        case 6:
                            d[u[l++]] = d[u[l++]] + d[u[l++]];
                            break;
                        case 14:
                            d[u[l++]] = d[u[l++]] / d[u[l++]];
                            break;
                        case 7:
                            d[u[l++]] = d[u[l++]] - d[u[l++]];
                            break;
                        case 24:
                            d[u[l++]] = d[u[l++]] ^ d[u[l++]];
                            break;
                        case 19:
                            d[u[l++]] = d[u[l++]] >>> d[u[l++]];
                            break;
                        case 20:
                            d[u[l++]] = d[u[l++]] % d[u[l++]];
                            break;
                        case 25:
                        case 13:
                            d[u[l++]] = d[u[l++]] != d[u[l++]];
                            break;
                        case 11:
                        case 12:
                            d[u[l++]] = d[u[l++]] == d[u[l++]];
                            break;
                        case 21:
                            d[u[l++]] = d[u[l++]] & d[u[l++]];
                            break;
                        case 17:
                            d[u[l++]] = d[u[l++]] << d[u[l++]];
                            break;
                        case 18:
                            d[u[l++]] = d[u[l++]] >> d[u[l++]];
                            break;
                        case 8:
                            d[u[l++]] = d[u[l++]] * d[u[l++]];
                            break;
                        case 9:
                            d[u[l++]] = d[u[l++]] <= d[u[l++]];
                            break;
                        case 10:
                            d[u[l++]] = d[u[l++]] >= d[u[l++]];
                            break;
                        case 15:
                            d[u[l++]] = d[u[l++]] < d[u[l++]];
                            break;
                        case 16:
                            d[u[l++]] = d[u[l++]] > d[u[l++]];
                            break;
                        case 37:
                            p.push(d[u[l++]]);
                            break;
                        case 38: {
                            const e = x(),
                                r = new Array(e);
                            for (let a = 0; a < e; a++) r[e - a - 1] = p.pop();
                            const a = u[l++];
                            d[0] = d[a].apply(o, r);
                            break
                        }
                        case 39: {
                            const e = x(),
                                r = new Array(e);
                            for (let a = 0; a < e; a++) r[e - a - 1] = p.pop();
                            const a = u[l++],
                                n = u[l++];
                            d[n] = Reflect.construct(d[a], r);
                            break
                        }
                        case 54:
                            d[u[l++]] = d[u[l++]][d[u[l++]]] = d[u[l++]];
                            break;
                        case 55:
                            d[u[l++]] = d[u[l++]][d[u[l++]]] += d[u[l++]];
                            break;
                        case 56:
                            d[u[l++]] = d[u[l++]][d[u[l++]]] -= d[u[l++]];
                            break;
                        case 35:
                            d[u[l++]] = s;
                            break;
                        case 36:
                            d[u[l++]] = d[u[l++]][d[u[l++]]];
                            break;
                        case 3:
                            d[u[l++]] = !!u[l++];
                            break;
                        case 40: {
                            const e = x(),
                                r = new Array(e);
                            for (let a = 0; a < e; a++) r[e - a - 1] = p.pop();
                            const a = u[l++],
                                n = u[l++],
                                t = d[a],
                                c = d[n];
                            d[0] = t[c].apply(t, r);
                            break
                        }
                        case 66:
                            throw d[u[l++]];
                        case 34: {
                            const e = u[l++],
                                r = x(),
                                a = g[r];
                            if (a in c) {
                                d[e] = c[a];
                                break
                            }
                            if (!(a in s)) throw new ReferenceError(a + " is not defined");
                            d[e] = s[a];
                            break
                        }
                        case 62: {
                            const e = x(),
                                r = new Array(e);
                            for (let a = 0; a < e; a++) r[e - a - 1] = p.pop();
                            d[u[l++]] = r
                        }
                        break;
                        case 63: {
                            const e = {},
                                r = x(),
                                a = u[l++];
                            for (let a = 0; a < r; a++) {
                                let r = p.pop(),
                                    a = p.pop();
                                switch (p.pop()) {
                                    case 0:
                                        e[a] = r;
                                        break;
                                    case 1:
                                        Object.defineProperty(e, a, {
                                            get: r
                                        });
                                        break;
                                    case 2:
                                        Object.defineProperty(e, a, {
                                            set: r
                                        })
                                }
                            }
                            d[a] = e;
                            break
                        }
                        case 64:
                            d[u[l++]] = null;
                            break;
                        case 65:
                            d[u[l++]] = void 0;
                            break;
                        case 27:
                            d[u[l++]] = h[x()][x()];
                            break;
                        case 28:
                            d[u[l++]] = h[x()][x()] = d[u[l++]];
                            break;
                        case 29:
                            d[u[l++]] = h[x()][x()] |= d[u[l++]];
                            break;
                        case 30:
                            d[u[l++]] = h[x()][x()] += d[u[l++]];
                            break;
                        case 31:
                            d[u[l++]] = h[x()][x()] -= d[u[l++]];
                            break;
                        case 32:
                            h[x()][x()] = d[u[l++]];
                            break;
                        case 47: {
                            const e = u[l++],
                                r = C();
                            d[e] || (l = r);
                            break
                        }
                        case 48: {
                            const e = u[l++],
                                r = C();
                            d[e] && (l = r);
                            break
                        }
                        case 42: {
                            const e = C();
                            l = e;
                            break
                        }
                        case 26:
                        case 45:
                            return d[0];
                        case 4:
                            d[u[l++]] = h[x()];
                            break;
                        case 43:
                            q.push(C());
                            break;
                        case 44:
                            q.pop();
                            break;
                        case 69:
                            h[O][x()] = G;
                            break;
                        default:
                            throw "u" + e
                    }
                }
            }(function() {
                for (l = 0;;) {
                    let e = u[l++];
                    if (33 === e) g.push(D());
                    else {
                        if (50 !== e) return void l--; {
                            const e = x(),
                                r = x(),
                                a = [];
                            for (let e = 0; e < r; e++) a.push(x());
                            j[e] = a
                        }
                    }
                }
            })(), F(0, l).call(this)
        }(0, {})
};