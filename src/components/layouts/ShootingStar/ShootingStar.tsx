"use client";

import type React from "react";
import { useEffect, useRef } from "react";

export const ShootingStar: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationFrameId: number;

    class Star {
      x!: number;
      y!: number;
      endX!: number;
      endY!: number;
      speed!: number;
      opacity!: number;
      trail!: { x: number; y: number; opacity: number }[];
      distanceTraveled!: number;
      totalDistance!: number;

      constructor() {
        this.reset();
      }

      reset() {
        // 画面の左側または上側からスタート
        if (Math.random() < 0.5) {
          // 左側からスタート
          if (!canvas) return;
          this.x = Math.random() * canvas.width * 0.3 - canvas.width * 0.2;
          this.y = Math.random() * canvas.height;
        } else {
          // 上側からスタート
          if (!canvas) return;
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height * 0.3 - canvas.height * 0.2;
        }

        // 右下方向の角度をランダムに設定（約0度〜60度）
        const angle = (Math.random() * Math.PI) / 3;

        // 軌道を長くするため、画面サイズの2倍の距離を設定
        const distance =
          Math.sqrt(
            canvas.width * canvas.width + canvas.height * canvas.height
          ) * 1.5;

        this.endX = this.x + Math.cos(angle) * distance;
        this.endY = this.y + Math.sin(angle) * distance;

        this.speed = Math.random() * 1200 + 800;
        this.opacity = 0;
        this.trail = [];
        this.distanceTraveled = 0;
        this.totalDistance = Math.random() * 600 + 200;
      }

      update(deltaTime: number) {
        const distance = this.speed * deltaTime;
        const angle = Math.atan2(this.endY - this.y, this.endX - this.x);
        this.x += Math.cos(angle) * distance;
        this.y += Math.sin(angle) * distance;

        this.distanceTraveled += distance;

        if (this.distanceTraveled < 100) {
          this.opacity = Math.min(this.distanceTraveled / 100, 1);
        } else if (this.distanceTraveled > this.totalDistance - 200) {
          this.opacity = Math.max(
            (this.totalDistance - this.distanceTraveled) / 200,
            0
          );
        }

        this.trail.unshift({ x: this.x, y: this.y, opacity: this.opacity });

        if (this.trail.length > 30) {
          this.trail.pop();
        }

        this.trail.forEach((point, index) => {
          point.opacity *= 0.95;
        });

        if (
          !canvas ||
          this.distanceTraveled >= this.totalDistance ||
          this.x > canvas.width ||
          this.y > canvas.height
        ) {
          return true;
        }

        return false;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);

        this.trail.forEach((point, index) => {
          ctx.lineTo(point.x, point.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${
            point.opacity * this.opacity * (1 - index / this.trail.length)
          })`;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
        });

        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const stars: Star[] = [];
    let lastTime = 0;
    let timeSinceLastStar = 0;

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      timeSinceLastStar += deltaTime;

      if (timeSinceLastStar > 3 + Math.random() * 2) {
        stars.push(new Star());
        timeSinceLastStar = 0;
      }

      stars.forEach((star, index) => {
        const finished = star.update(deltaTime);
        star.draw(ctx);
        if (finished) {
          stars.splice(index, 1);
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate(0);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

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
