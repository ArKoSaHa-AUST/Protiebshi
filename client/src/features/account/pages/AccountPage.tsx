import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BadgeCheck,
  BellRing,
  Building2,
  CalendarDays,
  CircleAlert,
  HandHeart,
  House,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserRound,
  Wrench,
  Search,
  ChevronRight,
} from 'lucide-react';

import { getPosts } from '@/api/feedApi';
import { getListings } from '@/services/listingService';
import { getRentListings } from '@/services/rentService';
import { getServices } from '@/services/serviceService';
import { getComplaints } from '@/services/complaintService';
import { getReliefs } from '@/api/relief';

const profileFields = [
  { label: 'Full Name', value: 'user', icon: UserRound },
  { label: 'Username', value: '@user123', icon: BadgeCheck },
  { label: 'Email', value: 'user123@gmail.com', icon: Mail },
  { label: 'Phone Number', value: '01234567891', icon: Phone },
  { label: 'City', value: 'Dhaka', icon: Building2 },
  { label: 'Neighborhood', value: 'Mirpur', icon: MapPin },
  { label: 'Full Address', value: '1111,user,Mirpur', icon: MapPin, fullWidth: true },
  { label: 'Short Bio', value: 'Life iz a Race!! Run!! Run!! Run!!', icon: Pencil, fullWidth: true },
] as const;

const accountDetails = [
  { label: 'Account Created', value: 'May 23, 2026', icon: CalendarDays },
  { label: 'Verification Status', value: 'Unverified', icon: ShieldCheck },
  { label: 'Email Verified', value: 'Pending', icon: Mail },
  { label: 'Phone On File', value: 'Available', icon: Phone },
] as const;

const accountStats = [
  { label: 'Posts Created', value: '3', note: 'Neighborhood updates and alerts', icon: Sparkles, gradient: 'from-emerald-50 to-white' },
  { label: 'Marketplace Listings', value: '1', note: 'Buyer-ready posts in circulation', icon: ShoppingBag, gradient: 'from-cyan-50 to-white' },
  { label: 'Services Offered', value: '0', note: 'Trusted skills shared locally', icon: Wrench, gradient: 'from-amber-50 to-white' },
  { label: 'Rent Listings', value: '0', note: 'Spaces currently managed', icon: House, gradient: 'from-violet-50 to-white' },
  { label: 'Complaints Submitted', value: '1', note: 'Reported issues awaiting resolution', icon: CircleAlert, gradient: 'from-rose-50 to-white' },
  { label: 'Relief Requests', value: '0', note: 'Support activity across the area', icon: HandHeart, gradient: 'from-emerald-50 to-white' },
] as const;

const settingsActions = [
  { label: 'Change Password', description: 'Update the current password for this demo account.', icon: ShieldCheck },
  { label: 'Notification Preferences', description: 'Keep alerts and neighborhood updates tuned to your needs.', icon: BellRing },
  { label: 'Privacy Settings', description: 'Control what parts of the profile remain visible.', icon: Settings2 },
] as const;

const tabs = [
  { id: 'feed', label: 'Feed Posts', icon: Sparkles },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  { id: 'rent', label: 'Rent Listings', icon: House },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'complaints', label: 'Complaints', icon: CircleAlert },
  { id: 'relief', label: 'Relief Posts', icon: HandHeart },
];

const statCardMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: 'easeOut' as const },
};

export const AccountPage = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [tabData, setTabData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'feed') {
          const res = await getPosts();
          setTabData(res.filter((r: any) => r.user?.id === 999 || r.user_id === 999));
        } else if (activeTab === 'marketplace') {
          const res = await getListings();
          setTabData(res.filter((r: any) => r.user_id === null || r.user_id === 999));
        } else if (activeTab === 'rent') {
          const res = await getRentListings();
          setTabData(res.filter((r: any) => r.user?.id === null || r.user?.id === 999));
        } else if (activeTab === 'services') {
          const res = await getServices();
          setTabData(res.filter((r: any) => r.ownerId === null || r.ownerId === 999));
        } else if (activeTab === 'complaints') {
          const res = await getComplaints();
          setTabData(res.data.filter((r: any) => r.user?.id === 999));
        } else if (activeTab === 'relief') {
          const res = await getReliefs();
          setTabData(res.filter((r: any) => r.user_id === 999 || r.user?.id === 999));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  return (
    <div className="relative isolate overflow-hidden px-3 pb-10 pt-2 md:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_38%),radial-gradient(circle_at_top_right,rgba(45,212,191,0.14),transparent_36%),linear-gradient(180deg,rgba(240,253,250,0.95),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute -left-10 top-24 -z-10 h-36 w-36 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-14 -z-10 h-44 w-44 rounded-full bg-teal-300/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="mx-auto max-w-7xl space-y-6"
      >
        <section className="relative overflow-hidden rounded-4xl border border-white/70 bg-[linear-gradient(135deg,rgba(222,253,245,0.96),rgba(243,253,250,0.94),rgba(255,255,255,0.98))] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.22),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(94,234,212,0.2),transparent_24%)]" />
          <div className="pointer-events-none absolute -right-6 top-5 h-24 w-24 rounded-full border border-white/40 bg-white/20" />
          <div className="pointer-events-none absolute bottom-3 left-[42%] h-16 w-16 rounded-[28px] border border-white/40 bg-emerald-200/20" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-2xl" />
                <img
                  src="/profilePicture.png"
                  alt="user profile"
                  className="relative h-28 w-28 rounded-full border-4 border-white/80 object-cover shadow-[0_18px_45px_rgba(16,185,129,0.28)] md:h-32 md:w-32"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">user</h1>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Unverified
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Secure account
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <BadgeCheck className="h-4 w-4 text-emerald-600" />
                      @user123
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      Mirpur, Dhaka
                    </span>
                  </div>
                </div>

                <p className="max-w-2xl text-base text-slate-700 md:text-lg">Life iz a Race!! Run!! Run!! Run!!</p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[26px] border border-white/60 bg-white/80 px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Member Since</p>
                    <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">May 2026</p>
                    <p className="mt-1 text-sm text-slate-600">Account tenure on Protibeshi</p>
                  </div>

                  <div className="rounded-[26px] border border-white/60 bg-white/80 px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Verification</p>
                    <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Unverified</p>
                    <p className="mt-1 text-sm text-slate-600">Pending confirmation</p>
                  </div>

                  <div className="rounded-[26px] border border-white/60 bg-white/80 px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Published Posts</p>
                    <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">3</p>
                    <p className="mt-1 text-sm text-slate-600">Content linked to this account</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 self-start lg:self-auto">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700"
              >
                <Settings2 className="h-4 w-4" />
                Settings
              </button>
            </div>
          </div>
        </section>

        {/* Dynamic User Content Section */}
        <section className="mt-8 rounded-4xl border border-slate-100 bg-white/95 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
            
            {/* Sidebar Tabs */}
            <div className="w-full lg:w-64 shrink-0">
              <h3 className="mb-4 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Your Content</h3>
              <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-none lg:mx-0 lg:px-0 lg:pb-0 lg:flex-col lg:gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex shrink-0 w-auto lg:w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="whitespace-nowrap">{tab.label}</span>
                      </div>
                      {isActive && <ChevronRight className="hidden lg:block h-4 w-4 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-w-0">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage your active {tabs.find(t => t.id === activeTab)?.label.toLowerCase()}
                  </p>
                </div>
                <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>

              {loading ? (
                <div className="flex h-40 items-center justify-center rounded-3xl border border-slate-100 bg-slate-50/50">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                </div>
              ) : tabData.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
                  <div className="mb-4 rounded-full bg-slate-100 p-4">
                    {(() => {
                      const Icon = tabs.find(t => t.id === activeTab)?.icon || Sparkles;
                      return <Icon className="h-8 w-8 text-slate-400" />;
                    })()}
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">No content found</h3>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    You haven't posted any {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <AnimatePresence mode="popLayout">
                    {tabData.map((item, index) => (
                      <motion.div
                        key={item.id || index}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="group relative flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <h3 className="text-base font-semibold tracking-tight text-slate-900 line-clamp-1">
                            {item.title || item.name || 'Untitled Post'}
                          </h3>
                          {(item.status || item.is_active || item.availability) && (
                            <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {item.status || (item.is_active ? 'Active' : 'Inactive') || item.availability}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                          {item.description || item.details || item.shortDescription || item.content || 'No description provided.'}
                        </p>
                        
                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                          <div className="text-xs font-medium text-slate-400">
                            {new Date(item.created_at || item.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                            View Details
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accountStats.map((card, index) => {
            const Icon = card.icon;

            return (
              <motion.article
                key={card.label}
                {...statCardMotion}
                transition={{ ...statCardMotion.transition, delay: index * 0.03 }}
                className={`rounded-[28px] border border-white/70 bg-linear-to-br ${card.gradient} p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">{card.label}</p>
                    <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{card.value}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white shadow-sm">
                    <Icon className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </motion.article>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="rounded-4xl border border-slate-100 bg-white/95 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">Protibeshi Account</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">Profile Information</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base md:leading-7">
              Public identity, contact details, and local presence visible across Protibeshi.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {profileFields.map((field) => {
                const Icon = field.icon;

                return (
                  <div
                    key={field.label}
                    className={field.fullWidth ? 'md:col-span-2' : undefined}
                  >
                    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                        <Icon className="h-4 w-4 text-emerald-600" />
                        {field.label}
                      </p>
                      <p className="mt-3 text-base text-slate-900 md:text-lg">{field.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.article>

          <div className="space-y-6">
            <motion.article
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
              className="rounded-4xl border border-slate-100 bg-white/95 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">Protibeshi Account</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">Account Details</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base md:leading-7">
                Security and verification signals that increase trust around your local activity.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {accountDetails.map((detail) => {
                  const Icon = detail.icon;

                  return (
                    <div key={detail.label} className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                        <Icon className="h-4 w-4 text-emerald-600" />
                        {detail.label}
                      </p>
                      <p className="mt-3 text-lg text-slate-950 md:text-xl">{detail.value}</p>
                    </div>
                  );
                })}
              </div>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.08 }}
              className="rounded-4xl border border-slate-100 bg-white/95 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">Protibeshi Account</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">Account Settings</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base md:leading-7">
                Quick controls for security, notifications, privacy, and account operations.
              </p>

              <div className="mt-8 space-y-3">
                {settingsActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.label}
                      type="button"
                      className="flex w-full items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50/70 px-5 py-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/60"
                    >
                      <span className="flex items-center gap-4">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-slate-900 md:text-base">{action.label}</span>
                          <span className="mt-1 block max-w-md text-xs leading-5 text-slate-600 md:text-sm md:leading-6">{action.description}</span>
                        </span>
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Open</span>
                    </button>
                  );
                })}
              </div>
            </motion.article>
          </div>
        </section>
      </motion.div>
    </div>
  );
};