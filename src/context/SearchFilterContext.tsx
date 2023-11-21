import {
  type Dispatch,
  type SetStateAction,
  createContext,
  useState,
} from "react";

// This enum will be used to key data in a hashmap which tracks what filters are active
export enum SearchFilterKeys {
  PRICE_RANGE = "PRICE_RANGE",
  SURFACE_AREA_RANGE = "SURFACE_AREA_RANGE",
  PLANET_QUALITIES = "PLANET_QUALITIES",
  PLANET_TERRAINS = "PLANET_TERRAINS",
  PLANET_TEMPERATURES = "PLANET_TEMPERATURES",
}

type SearchFilterCTX = {
  setActiveFilters: Dispatch<SetStateAction<Record<SearchFilterKeys, boolean>>>;
  setFilterActive: (filter: SearchFilterKeys, active: boolean) => void;
  getActiveFilterCount: () => number;
  activeFilters: Record<SearchFilterKeys, boolean>;
};

export const SearchFilterContext = createContext<SearchFilterCTX>({
  activeFilters: {
    PLANET_QUALITIES: false,
    PLANET_TEMPERATURES: false,
    PLANET_TERRAINS: false,
    PRICE_RANGE: false,
    SURFACE_AREA_RANGE: false,
  },
  getActiveFilterCount() {
    throw Error("Not implemented");
  },
  setActiveFilters() {
    throw Error("Not implemented");
  },
  setFilterActive() {
    throw Error("Not implemented");
  },
});

export default function SearchFilterProvider({
  children,
}: {
  children: JSX.Element[] | JSX.Element;
}) {
  const [activeFilters, setActiveFilters] = useState<
    Record<SearchFilterKeys, boolean>
  >({
    PRICE_RANGE: false,
    SURFACE_AREA_RANGE: false,
    PLANET_QUALITIES: false,
    PLANET_TERRAINS: false,
    PLANET_TEMPERATURES: false,
  });

  // Sets a single filters state
  function setFilterActive(filter: SearchFilterKeys, active: boolean) {
    // Update the search filter context
    setActiveFilters((past) => {
      return {
        ...past,
        [filter]: active,
      };
    });
  }

  // Returns the amount of filters currently active
  function getActiveFilterCount(): number {
    let activeFilterCount = 0;

    Object.values(activeFilters).map((filter) => {
      if (filter) {
        activeFilterCount += 1;
      }
    });

    return activeFilterCount;
  }

  return (
    <SearchFilterContext.Provider
      value={{
        activeFilters: activeFilters,
        setActiveFilters: setActiveFilters,
        setFilterActive: setFilterActive,
        getActiveFilterCount: getActiveFilterCount,
      }}
    >
      {children}
    </SearchFilterContext.Provider>
  );
}
