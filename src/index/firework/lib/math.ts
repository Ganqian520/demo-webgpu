const EPSILON = 0.000001;

export class Vec4 {
	x: number
	y: number
	z: number
	w: number
	constructor(x = 0, y = 0, z = 0, w = 0) {
		this.x = x
		this.y = y
		this.z = z
		this.w = w
	}
}

export class Vec3 {

	x: number
	y: number
	z: number

	isVec3: true

	constructor(x?: number, y?: number, z?: number) {
		this.x = x ?? 0
		this.y = y ?? 0
		this.z = z ?? 0
	}

	get value() {
		return [this.x, this.y, this.z]
	}

	distanceTo(x: number, y: number, z: number) {
		return Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2 + (this.z - z) ** 2)
	}

	clone() {
		return new Vec3(this.x, this.y, this.z)
	}

	applyMatrix(m: Mat4) {

		const x = this.x, y = this.y, z = this.z;
		const e = m.elements;

		let w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
		w = 1

		this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
		this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
		this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;

		return this;
	}

	log(msg = '') {
		const tf = (n: number) => Math.floor(n * 100) / 100
		console.log(msg, tf(this.x), tf(this.y), tf(this.z));
		return this
	}
}

export class Mat4 {

	static fromPosAndSize(pos: Vec3, size: number) {
		let tm = new Mat4()
		return tm.set(
			size, 0, 0, pos.x,
			0, size, 0, pos.y,
			0, 0, size, pos.z,
			0, 0, 0, 1
		)
	}

	elements: number[]

	constructor() {
		this.elements = [

			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1

		];
	}



	//列向量写法
	set(n11: number, n12: number, n13: number, n14: number, n21: number, n22: number, n23: number, n24: number, n31: number, n32: number, n33: number, n34: number, n41: number, n42: number, n43: number, n44: number) {

		const te = this.elements;

		te[0] = n11; te[4] = n12; te[8] = n13; te[12] = n14;
		te[1] = n21; te[5] = n22; te[9] = n23; te[13] = n24;
		te[2] = n31; te[6] = n32; te[10] = n33; te[14] = n34;
		te[3] = n41; te[7] = n42; te[11] = n43; te[15] = n44;

		return this;

	}

	log(msg = '') {
		const e = [...this.elements].map(v => Math.floor(v * 100) / 100)
		console.log(`${msg}===========`);
		for (let i = 0; i < 4; i++) {
			console.log(e[i], e[i + 4], e[i + 8], e[i + 12]);
		}
		return this
	}
	
	getPosition() {
		const te = this.elements
		const x = te[12], y = te[13], z = te[14]
		return new Vec3(x, y, z)
	}

	//左乘指本矩阵在左侧 A左乘B = A*B = B右乘A
	multiply(m: Mat4) {

		this.elements = Mat4.multiplyMatrices(this, m).elements
		return this

	}

	premutiply(m: Mat4) {
		this.elements = Mat4.multiplyMatrices(m, this).elements
	}

	clone() {
		let m = new Mat4()
		m.elements = [...this.elements]
		return m
	}

	static makeTranspose(m: Mat4) {

		const out = m.clone()
		const te = out.elements;
		let tmp: number;

		tmp = te[1]; te[1] = te[4]; te[4] = tmp;
		tmp = te[2]; te[2] = te[8]; te[8] = tmp;
		tmp = te[6]; te[6] = te[9]; te[9] = tmp;

		tmp = te[3]; te[3] = te[12]; te[12] = tmp;
		tmp = te[7]; te[7] = te[13]; te[13] = tmp;
		tmp = te[11]; te[11] = te[14]; te[14] = tmp;

		return out;
	}

	static makeRotateInvert(m: Mat4) {
		return Mat4.makeTranspose(m)
	}

	static makeTrasitionInvert(m: Mat4) {
		const out = m.clone()
		out[12] = -out[12]
		out[13] = -out[13]
		out[14] = -out[14]
		return out
	}

	static makeScaleInvert(m: Mat4) {
		const out = m.clone()
		out[0] = 1 / out[0]
		out[5] = 1 / out[5]
		out[10] = 1 / out[10]
		return out
	}

	static makeInvert(m: Mat4) {
		const out = m.clone()
		const te = out.elements,

			n11 = te[0], n21 = te[1], n31 = te[2], n41 = te[3],
			n12 = te[4], n22 = te[5], n32 = te[6], n42 = te[7],
			n13 = te[8], n23 = te[9], n33 = te[10], n43 = te[11],
			n14 = te[12], n24 = te[13], n34 = te[14], n44 = te[15],

			t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
			t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
			t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
			t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

		const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

		if (det === 0) return out.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

		const detInv = 1 / det;

		te[0] = t11 * detInv;
		te[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * detInv;
		te[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * detInv;
		te[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * detInv;

		te[4] = t12 * detInv;
		te[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * detInv;
		te[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * detInv;
		te[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * detInv;

		te[8] = t13 * detInv;
		te[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * detInv;
		te[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * detInv;
		te[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * detInv;

		te[12] = t14 * detInv;
		te[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * detInv;
		te[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * detInv;
		te[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * detInv;

		return out;

	}

	static multiplyMatrices(...arr: Mat4[]) {
		return arr.reduce((pre: Mat4, cur: Mat4) => {
			const tm = new Mat4()
			const ae = pre.elements;
			const be = cur.elements;
			const te = tm.elements;

			const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
			const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
			const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
			const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

			const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
			const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
			const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
			const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

			te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
			te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
			te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
			te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

			te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
			te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
			te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
			te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

			te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
			te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
			te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
			te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

			te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
			te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
			te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
			te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
			return tm
		})
	}

	static makeTranslation(x_: number | Vec3, y?: number, z?: number) {

		const out = new Mat4()

		let x: number

		if (x_ instanceof Vec3) {
			x = x_.x
			y = x_.y
			z = x_.z
		} else {
			x = x_
		}

		out.set(

			1, 0, 0, x,
			0, 1, 0, y,
			0, 0, 1, z,
			0, 0, 0, 1

		);

		return out;

	}

	static makeScale(x_: number | Vec3, y?: number, z?: number) {
		const out = new Mat4()

		let x: number

		if (x_ instanceof Vec3) {
			x = x_.x
			y = x_.y
			z = x_.z
		} else {
			x = x_
		}

		out.set(

			x, 0, 0, 0,
			0, y, 0, 0,
			0, 0, z, 0,
			0, 0, 0, 1

		);

		return out;

	}

	static makeRotationX(theta: number) {
		const out = new Mat4()

		const c = Math.cos(theta), s = Math.sin(theta);

		out.set(

			1, 0, 0, 0,
			0, c, - s, 0,
			0, s, c, 0,
			0, 0, 0, 1

		);

		return out;

	}

	static makeRotationY(theta: number) {

		const out = new Mat4()

		const c = Math.cos(theta), s = Math.sin(theta);

		out.set(

			c, 0, s, 0,
			0, 1, 0, 0,
			- s, 0, c, 0,
			0, 0, 0, 1

		);

		return out;

	}

	static makeRotationZ(theta: number) {
		const out = new Mat4()

		const c = Math.cos(theta), s = Math.sin(theta);

		out.set(

			c, - s, 0, 0,
			s, c, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1

		);

		return out;

	}

	static makeRotationAxis(axis: Vec3, angle: number) {
		const out = new Mat4()

		const c = Math.cos(angle);
		const s = Math.sin(angle);
		const t = 1 - c;
		const x = axis.x, y = axis.y, z = axis.z;
		const tx = t * x, ty = t * y;

		out.set(

			tx * x + c, tx * y - s * z, tx * z + s * y, 0,
			tx * y + s * z, ty * y + c, ty * z - s * x, 0,
			tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
			0, 0, 0, 1

		);

		return out;

	}

	static makeOrthProMatrix(height: number, aspect: number, near: number, far: number) {

		const width = aspect * height


		const T = new Mat4().multiply(Mat4.makeTranslation(0, 0, near))
		const S = new Mat4().multiply(Mat4.makeScale(2 / width, 2 / height, 1 / (far - near)))

		const out = S
		return out
	}

	static makePerspective(fov: number, aspect: number, near: number, far: number) {

		const out = new Mat4()

		// const cot = 1 / Math.tan(fov)

		// this.set(
		// 	cot / aspect, 0, 0, 0,
		// 	0, cot, 0, 0,
		// 	0, 0, far / (far - near), far * near / (near - far),
		// 	0, 0, 1, 0
		// )

		const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far)

		out.set(
			f / aspect, 0, 0, 0,
			0, f, 0, 0,
			0, 0, (far + near) * nf, 2 * far * near * nf,
			0, 0, -1, 0
		)



		// let l: number, r: number, b: number, t: number, n: number, f: number

		// let Morth = new Mat4().set(
		// 	2 / (r - l), 0, 0, -(l + r) / 2,
		// 	0, 2 / (t - b), 0, -(b + t) / 2,
		// 	0, 0, 2 / (n - f), -(n + f) / 2,
		// 	0, 0, 0, 1,
		// )

		return out;

	}


	static makeOrthoPerspective(near: number, far: number, aspect: number) {

		let l: number, r: number, b: number, t: number, n: number, f: number

		let Morth = new Mat4().set(
			2 / (r - l), 0, 0, -(l + r) / 2,
			0, 2 / (t - b), 0, -(b + t) / 2,
			0, 0, 2 / (n - f), -(n + f) / 2,
			0, 0, 0, 1,
		)

		return Morth
	}

}

