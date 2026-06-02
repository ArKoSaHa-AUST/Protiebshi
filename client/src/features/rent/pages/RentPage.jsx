// src/features/rent/pages/RentPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import RentListingCard from '../components/RentListingCard';
import RentDetailsDrawer from '../components/RentDetailsDrawer';
import RentFilters from '../components/RentFilters';
import AddPropertyModal from '../components/AddPropertyModal';
import { getRentListings, reportRentListing } from '@/services/rentService';
import styles from './RentPage.module.css';

const defaultFilters = {
  radius: null,
  minPrice: 0,
  maxPrice: null,
  propertyTypes: [],
  bedrooms: [],
  furnishing: [],
  availability: [],
  verifiedOnly: false,
  sort: 'nearest',
};

const listingBedroomBucket = (listing) => {
  const beds = Number(listing?.beds ?? 0);
  if (!Number.isFinite(beds) || beds <= 0) return 'studio';
  if (beds === 1) return '1bhk';
  if (beds === 2) return '2bhk';
  return '3bhk';
};

const normalizeAvailabilityBucket = (listing) => {
  const value = String(listing?.availability || '').toLowerCase();
  if (value === 'now' || value === 'flexible' || value === 'dated') return value;
  if (value.includes('now')) return 'now';
  if (value.includes('flexible')) return 'flexible';
  return 'dated';
};

const getListingTimestamp = (listing) => {
  if (listing?.created_at) {
    const parsed = Date.parse(listing.created_at);
    if (!Number.isNaN(parsed)) return parsed;
  }

  if (typeof listing?.listedDays === 'number' && Number.isFinite(listing.listedDays)) {
    return Date.now() - listing.listedDays * 86_400_000;
  }

  return 0;
};

const applyFiltersAndSort = (listings, filters) => {
  const filtered = listings.filter((listing) => {
    const price = Number(listing?.price ?? 0);
    const distance = Number(listing?.distance ?? Number.POSITIVE_INFINITY);
    const type = String(listing?.type || '').toLowerCase();
    const furnishing = String(listing?.furnishing || '').toLowerCase();
    const availability = normalizeAvailabilityBucket(listing);
    const isVerified = Boolean(listing?.verified || listing?.verified_landlord);

    if (filters.radius !== null && Number.isFinite(distance) && distance > filters.radius) {
      return false;
    }

    if (price < (filters.minPrice ?? 0)) {
      return false;
    }

    if (filters.maxPrice !== null && price > filters.maxPrice) {
      return false;
    }

    if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(type)) {
      return false;
    }

    if (filters.bedrooms.length > 0 && !filters.bedrooms.includes(listingBedroomBucket(listing))) {
      return false;
    }

    if (filters.furnishing.length > 0 && !filters.furnishing.includes(furnishing)) {
      return false;
    }

    if (filters.availability.length > 0 && !filters.availability.includes(availability)) {
      return false;
    }

    if (filters.verifiedOnly && !isVerified) {
      return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((left, right) => {
    switch (filters.sort) {
      case 'price-low':
        return Number(left?.price ?? 0) - Number(right?.price ?? 0);
      case 'price-high':
        return Number(right?.price ?? 0) - Number(left?.price ?? 0);
      case 'recent':
        return getListingTimestamp(right) - getListingTimestamp(left);
      case 'popular':
        return Number(right?.views ?? 0) - Number(left?.views ?? 0);
      case 'nearest':
      default:
        return Number(left?.distance ?? Number.POSITIVE_INFINITY) - Number(right?.distance ?? Number.POSITIVE_INFINITY);
    }
  });

  return sorted;
};

export const RentPage = () => {
  const [allListings, setAllListings] = useState([]);
  const [activeDetails, setActiveDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);

  const fetchRentListings = useCallback(async () => {
    setIsLoading(true);
    setFeedError(null);

    try {
      const data = await getRentListings();
      setAllListings(data);
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : 'Failed to load rent listings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRentListings();
  }, [fetchRentListings]);

  const listings = useMemo(() => applyFiltersAndSort(allListings, filters), [allListings, filters]);

  const handleContact = useCallback((listing) => {
    window.alert(`Demo mode: contact for ${listing?.title || 'this listing'} is not wired yet.`);
  }, []);

  const handleReport = useCallback(async (listing, reason = '') => {
    return reportRentListing(listing?.id, reason);
  }, []);

  const handleOpenFilters = useCallback(() => {
    setActiveDetails(null);
    setIsAddPropertyOpen(false);
    setIsFiltersOpen(true);
  }, []);

  const handleAddProperty = useCallback(() => {
    setActiveDetails(null);
    setIsFiltersOpen(false);
    setIsAddPropertyOpen(true);
  }, []);

  const handlePropertyAdded = useCallback((newListing) => {
    if (!newListing) return;
    setAllListings((prev) => {
      const withoutDuplicate = prev.filter((item) => Number(item?.id) !== Number(newListing?.id));
      return [newListing, ...withoutDuplicate];
    });
    setActiveDetails(newListing);
  }, []);

  return (
    <div className={styles.rentPage}>
      <header className={styles.header}>
        <div className={styles.headerMedia}>
          <video
            className={styles.headerVideo}
            src="/homeRent.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>

        <div className={styles.headerOverlay} />

        <div className={styles.headerContent}>
          <h1 className={styles.title}>My neighborhood</h1>
          <p className={styles.subtitle}>Local feed &amp; community updates</p>
        </div>

        <button
          type="button"
          className={styles.openFiltersButton}
          onClick={handleOpenFilters}
        >
          Open Filters
        </button>

        <button
          type="button"
          className={styles.addPropertyButton}
          onClick={handleAddProperty}
        >
          + Add Property
        </button>
      </header>

      <div className={styles.contentGrid}>
        <motion.section
          className={styles.listingsGrid}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {isLoading ? (
            <div className={styles.feedStatus}>
              <p>Loading listings…</p>
            </div>
          ) : feedError ? (
            <div className={styles.feedStatus}>
              <p className={styles.feedError}>{feedError}</p>
            </div>
          ) : listings.length > 0 ? (
            listings.map((listing) => (
              <RentListingCard
                key={listing.id}
                listing={listing}
                onViewDetails={setActiveDetails}
                onMessage={handleContact}
              />
            ))
          ) : (
            <div className={styles.emptyState}>
              <h3>No listings found</h3>
              <p>Try changing your filters.</p>
            </div>
          )}
        </motion.section>
      </div>

      {isFiltersOpen && (
        <div
          className={styles.filtersModalOverlay}
          onClick={() => setIsFiltersOpen(false)}
          role="presentation"
        >
          <motion.section
            className={styles.filtersModal}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.filtersModalHeader}>
              <h3 className={styles.filtersModalTitle}>Filter Properties</h3>
              <button
                type="button"
                className={styles.filtersModalClose}
                onClick={() => setIsFiltersOpen(false)}
              >
                Close
              </button>
            </div>

            <div className={styles.filterInner}>
              <RentFilters filters={filters} onFilterChange={setFilters} />
            </div>
          </motion.section>
        </div>
      )}

      {isAddPropertyOpen && (
        <AddPropertyModal
          onClose={() => setIsAddPropertyOpen(false)}
          onSuccess={handlePropertyAdded}
        />
      )}

      <RentDetailsDrawer
        listing={activeDetails}
        onClose={() => setActiveDetails(null)}
        onContact={(listing) => {
          setActiveDetails(null);
          handleContact(listing);
        }}
        onReport={handleReport}
      />
    </div>
  );
};

export default RentPage;