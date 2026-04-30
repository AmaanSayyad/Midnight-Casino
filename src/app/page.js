'use client';

import React from 'react';
import HeroSection from "@/components/HeroSection";
import FeatureSection from "@/components/FeatureSection";
import GameCarousel from "@/components/GameCarousel";
import LetsPlaySection from "@/components/LetsPlaySection";
import LiveStatsSection from "@/components/LiveStatsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import UpcomingTournaments from "@/components/UpcomingTournaments";
import NewsUpdates from "@/components/NewsUpdates";
import ProvablyFairSection from "@/components/ProvablyFairSection";

// Safe component renderer
const SafeRender = ({ Component, name }) => {
  if (!Component) {
    console.error(`Component ${name} is undefined`);
    return null;
  }
  if (typeof Component !== 'function') {
    console.error(`Component ${name} is not a function:`, typeof Component, Component);
    return null;
  }
  try {
    return React.createElement(Component);
  } catch (error) {
    console.error(`Error rendering ${name}:`, error);
    return null;
  }
};

export default function Home() {
  return (
    <div className="bg-[#070005] overflow-x-hidden w-full">
      <SafeRender Component={HeroSection} name="HeroSection" />
      <SafeRender Component={FeatureSection} name="FeatureSection" />
      <SafeRender Component={GameCarousel} name="GameCarousel" />
      <SafeRender Component={HowItWorksSection} name="HowItWorksSection" />
      <SafeRender Component={UpcomingTournaments} name="UpcomingTournaments" />
      <SafeRender Component={TestimonialsSection} name="TestimonialsSection" />
      <SafeRender Component={NewsUpdates} name="NewsUpdates" />
      <SafeRender Component={ProvablyFairSection} name="ProvablyFairSection" />
      <SafeRender Component={LetsPlaySection} name="LetsPlaySection" />
    </div>
  );
}
