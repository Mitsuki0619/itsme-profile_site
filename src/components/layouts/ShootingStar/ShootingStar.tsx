"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";

export const ShootingStar: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const createStar = useCallback((): {
		x: number;
		y: number;
		endX: number;
		endY: number;
		speed: number;
		opacity: number;
		trail: { x: number; y: number; opacity: number }[];
		distanceTraveled: number;
		totalDistance: number;
	} | null => {
		const canvas = canvasRef.current;
		if (!canvas) return null;

		// 画面の左側または上側からスタート
		const startFromLeft = Math.random() < 0.5;
		const x = startFromLeft
			? Math.random() * canvas.width * 0.3 - canvas.width * 0.2
			: Math.random() * canvas.width;
		const y = startFromLeft
			? Math.random() * canvas.height
			: Math.random() * canvas.height * 0.3 - canvas.height * 0.2;

		// 右下方向の角度をランダムに設定（約0度〜60度）
		const angle = (Math.random() * Math.PI) / 3;

		// 軌道を長くするため、画面サイズの2倍の距離を設定
		const distance = Math.sqrt(canvas.width ** 2 + canvas.height ** 2) * 1.5;

		return {
			x,
			y,
			endX: x + Math.cos(angle) * distance,
			endY: y + Math.sin(angle) * distance,
			speed: Math.random() * 1200 + 800,
			opacity: 0,
			trail: [],
			distanceTraveled: 0,
			totalDistance: Math.random() * 600 + 200,
		};
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		const stars: ReturnType<typeof createStar>[] = [];
		let lastTime = 0;
		let timeSinceLastStar = 0;

		const animate = (currentTime: number) => {
			const deltaTime = (currentTime - lastTime) / 1000;
			lastTime = currentTime;

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			timeSinceLastStar += deltaTime;

			if (timeSinceLastStar > 3 + Math.random() * 2) {
				const newStar = createStar();
				if (newStar) stars.push(newStar);
				timeSinceLastStar = 0;
			}

			stars.forEach((star, index) => {
				if (!star) return;

				const distance = star.speed * deltaTime;
				const angle = Math.atan2(star.endY - star.y, star.endX - star.x);
				star.x += Math.cos(angle) * distance;
				star.y += Math.sin(angle) * distance;

				star.distanceTraveled += distance;

				if (star.distanceTraveled < 100) {
					star.opacity = Math.min(star.distanceTraveled / 100, 1);
				} else if (star.distanceTraveled > star.totalDistance - 200) {
					star.opacity = Math.max(
						(star.totalDistance - star.distanceTraveled) / 200,
						0,
					);
				}

				star.trail.unshift({ x: star.x, y: star.y, opacity: star.opacity });

				if (star.trail.length > 30) {
					star.trail.pop();
				}

				star.trail.forEach((point, index) => {
					point.opacity *= 0.95;
				});

				if (
					star.distanceTraveled >= star.totalDistance ||
					star.x > canvas.width ||
					star.y > canvas.height
				) {
					stars.splice(index, 1);
					return;
				}

				ctx.strokeStyle = `rgba(255, 255, 255, ${star.opacity})`;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(star.x, star.y);

				star.trail.forEach((point, index) => {
					ctx.lineTo(point.x, point.y);
					ctx.strokeStyle = `rgba(255, 255, 255, ${
						point.opacity * star.opacity * (1 - index / star.trail.length)
					})`;
					ctx.stroke();
					ctx.beginPath();
					ctx.moveTo(point.x, point.y);
				});

				ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
				ctx.beginPath();
				ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
				ctx.fill();
			});

			requestAnimationFrame(animate);
		};

		const animationId = requestAnimationFrame(animate);

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			cancelAnimationFrame(animationId);
		};
	}, [createStar]);

	return (
		<canvas
			ref={canvasRef}
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				pointerEvents: "none",
				zIndex: 10,
			}}
		/>
	);
};
