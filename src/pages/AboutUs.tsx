import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion } from 'motion/react';
import { bannerApi } from '../services/api';
import { Banner } from '../types';

export default function AboutUs() {
  const [aboutUsBanner, setAboutUsBanner] = useState<Banner | null>(null);
  const [visionBanner, setVisionBanner] = useState<Banner | null>(null);
  const [missionBanner, setMissionBanner] = useState<Banner | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const [aboutUs, vision, mission] = await Promise.all([
          bannerApi.getBanner('about-us'),
          bannerApi.getBanner('vision'),
          bannerApi.getBanner('mission')
        ]);

        if (aboutUs.data.success) setAboutUsBanner(aboutUs.data.data);
        if (vision.data.success) setVisionBanner(vision.data.data);
        if (mission.data.success) setMissionBanner(mission.data.data);
      } catch (error) {
        console.error('Error fetching About Us banners:', error);
      }
    };
    fetchBanners();
  }, []);

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased min-h-screen flex flex-col pt-20">
      <Header />
      
      <main className="flex-grow">
        {/* Section 1: Hero & Brand Story */}
        <section className="relative w-full">
          <div 
            className="h-[60vh] md:h-[70vh] w-full bg-cover bg-center flex items-end relative overflow-hidden" 
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.1), rgba(73, 53, 44, 0.6)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDwXCSBrfRHVNBDpgDBy7oQHRurbM2rt3JWY6MsuLOWSM6Z2ExUxrBhMP5wY_zLZr616NT_k0o6zNliW1nUvLeHlylhnw-JvZK22teuYhut09Jysd22zwjck4WdfQw4NNjQEEwrpHcNHR-LkKJUu0WLLx3PJ7PEjsc6xJnDt7m0U7HZL0_moQSZL94NxMfVXn6dg5T9k7gJcuE1Eqgka-oja6qCTD9zbQIcMo8jEz4CJytrWb6CxJ7AHXSBsKkZaIxeAaiLOR2azBU1")'
            }}
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-20 pb-16 w-full text-white">
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-sm uppercase tracking-[0.3em] font-medium opacity-90 block mb-4"
              >
                {aboutUsBanner?.title || "Est. 2018"}
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl md:text-7xl font-bold leading-tight max-w-2xl"
              >
                {aboutUsBanner?.subtitle || "The Craft of Resilience."}
              </motion.h2>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 lg:px-20 py-24 grid md:grid-cols-12 gap-12 items-center text-primary dark:text-slate-100">
            <div className="md:col-span-7">
              <h3 className="text-3xl font-bold mb-8">
                Where function meets heritage.
              </h3>
              <div className="space-y-6 text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-light whitespace-pre-wrap">
                <p>FoxWear began in a small studio in East London with a singular vision: to create apparel that doesn't just look good, but withstands the demands of the modern pioneer.</p>
                <p>We spent eighteen months sourcing the finest organic cottons and high-performance recycled synthetics before our first garment ever left the cutting table. We believe in the slow movement—fewer pieces, higher quality, and a profound respect for the hands that make them.</p>
                <p>Today, FoxWear is a community of creators, athletes, and thinkers who value the intersection of minimalist aesthetics and peak performance.</p>
              </div>
            </div>
            <div className="md:col-span-5 relative">
              <img 
                alt="Designer working on a high-quality fabric pattern" 
                className="rounded-xl shadow-2xl w-full h-[500px] object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAG-LtHJ74dEWLxeYfsjO9cWAfAteH1re6M_FD8VPgTAqgA0np7HyIKI1Ath3p2MPxfY7_4ghEtL8OWnlQLOm_Mcds8oyv93U4hAhGEcWo4uqQoUdHtq68vZwXBHOwQXUabSc3PnsznNhIXBynJP2FDqkZhx78h72z7y8NvKTIxvBD7P8RtUpkGd8U1EazQpvWZ8p8k8z1jFdhql-QaJsdwKtp4I21KjFMG9B3k7lpA0Am7Din3gC98I3YzUHXmY94v8iudU9mgg63Z"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-6 -left-6 bg-primary p-8 hidden lg:block rounded-lg text-white dark:text-background-dark">
                <p className="text-4xl font-bold">100%</p>
                <p className="text-xs uppercase tracking-widest opacity-80">Traceable Materials</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Vision & Mission */}
        <section className="bg-primary text-white py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-20 grid md:grid-cols-2 gap-20">
            <div className="flex flex-col gap-6">
              <div className="w-12 h-px bg-white/40"></div>
              <span className="text-xs uppercase tracking-[0.4em] font-bold">Our Vision</span>
              <h3 className="text-4xl font-bold">
                {visionBanner?.title || "To redefine global standards for conscious, timeless fashion that transcends seasonal trends."}
              </h3>
              <p className="text-white/70 text-lg font-light leading-relaxed">
                {visionBanner?.subtitle || "We envision a world where every garment is an investment in quality and ethics. A world where style does not come at the cost of the environment or human dignity."}
              </p>
            </div>
            <div className="flex flex-col gap-6">
              <div className="w-12 h-px bg-white/40"></div>
              <span className="text-xs uppercase tracking-[0.4em] font-bold">Our Mission</span>
              <h3 className="text-4xl font-bold">
                {missionBanner?.title || "Empowering the individual through thoughtfully designed apparel that balances form and function."}
              </h3>
              <p className="text-white/70 text-lg font-light leading-relaxed">
                {missionBanner?.subtitle || "Our mission is to provide gear that facilitates movement and focus. We strive to merge technical innovation with classic silhouettes for the modern wardrobe."}
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Our Values */}
        <section className="py-24 bg-background-light dark:bg-background-dark">
          <div className="max-w-7xl mx-auto px-6 lg:px-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-primary dark:text-slate-100 mb-4 tracking-tight">Rooted in Integrity</h2>
              <p className="text-slate-500 max-w-xl mx-auto font-light">The principles that guide every decision we make, from design to delivery.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-10 border border-primary/10 rounded-xl bg-white dark:bg-primary/5 hover:border-primary/30 transition-all group">
                <span className="material-symbols-outlined text-4xl text-primary dark:text-white/80 mb-6 group-hover:scale-110 transition-transform">eco</span>
                <h4 className="text-xl font-bold mb-4 text-primary dark:text-slate-100 tracking-tight">Radical Transparency</h4>
                <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">We share our supply chain journey with you. Every factory, every fabric, every cost is open for exploration.</p>
              </div>
              <div className="p-10 border border-primary/10 rounded-xl bg-white dark:bg-primary/5 hover:border-primary/30 transition-all group">
                <span className="material-symbols-outlined text-4xl text-primary dark:text-white/80 mb-6 group-hover:scale-110 transition-transform">architecture</span>
                <h4 className="text-xl font-bold mb-4 text-primary dark:text-slate-100 tracking-tight">Precision Craft</h4>
                <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">We obsess over the details. Double-stitched seams and custom-developed buttons ensure longevity in every piece.</p>
              </div>
              <div className="p-10 border border-primary/10 rounded-xl bg-white dark:bg-primary/5 hover:border-primary/30 transition-all group">
                <span className="material-symbols-outlined text-4xl text-primary dark:text-white/80 mb-6 group-hover:scale-110 transition-transform">diversity_3</span>
                <h4 className="text-xl font-bold mb-4 text-primary dark:text-slate-100 tracking-tight">Cultural Legacy</h4>
                <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">We believe apparel is an expression of culture. We partner with local artists and innovators to keep creativity thriving.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: FAQs */}
        <section className="py-24 bg-primary/5 dark:bg-white/5">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-center text-primary dark:text-slate-100 mb-12 tracking-tight">Common Inquiries</h2>
            <div className="space-y-4">
              {[
                {
                  q: "Where are your garments manufactured?",
                  a: "We partner with certified boutique factories in Portugal, Italy, and Vietnam. Each facility is vetted for fair wages, safe conditions, and environmental standards."
                },
                {
                  q: "What makes FoxWear sustainable?",
                  a: "Our sustainability model rests on three pillars: using recycled/organic materials, ensuring lifelong durability, and providing a circular repair program for all items."
                },
                {
                  q: "Do you offer a warranty on products?",
                  a: "Yes. Every FoxWear garment comes with a 2-year quality guarantee. If a seam fails or a button detaches under normal use, we repair it free of charge."
                }
              ].map((faq, index) => (
                <div key={index} className="bg-background-light dark:bg-background-dark p-6 rounded-lg border border-primary/10">
                  <details className="group">
                    <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-primary dark:text-slate-100 tracking-tight">
                      <span>{faq.q}</span>
                      <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
                    </summary>
                    <div className="mt-4 text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                      {faq.a}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
