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
  getActiveFilters: () => SearchFilterKeys[];
  setActiveFilters: Dispatch<SetStateAction<Record<SearchFilterKeys, boolean>>>;
  setFilterActive: (filter: SearchFilterKeys, active: boolean) => void;
};

export const SearchFilterContext = createContext<SearchFilterCTX>({
  getActiveFilters() {
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

  // Returns an array of `SearchFilterKeys` indicating filters that are active
  function getActiveFilters() {
    const _activeFilters: SearchFilterKeys[] = [];

    // If an entry inside the object has its value set to true
    // Add the key of that entry (the SearchFilterKey) to the activeFilters array
    for (const filter of Object.entries(activeFilters)) {
      if (filter[1]) {
        _activeFilters.push(filter[0] as SearchFilterKeys);
      }
    }

    return _activeFilters;
  }

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

  return (
    <SearchFilterContext.Provider
      value={{
        getActiveFilters: getActiveFilters,
        setActiveFilters: setActiveFilters,
        setFilterActive: setFilterActive,
      }}
    >
      {children}
    </SearchFilterContext.Provider>
  );
}
