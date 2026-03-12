const STORAGE_KEY = "academy_branding_mock_state_v1";

const readState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const getDefaultClub = (clubId) => ({
  id: clubId,
  name: "Academy",
  settings: {
    branding: {
      badgeUrl: null,
      heroImageUrl: null,
    },
  },
});

const getClubState = (clubId) => {
  const state = readState();
  if (!state[clubId]) {
    state[clubId] = getDefaultClub(clubId);
    writeState(state);
  }
  return state[clubId];
};

const updateClubState = (clubId, updater) => {
  const state = readState();
  const current = state[clubId] || getDefaultClub(clubId);
  state[clubId] = updater(current);
  writeState(state);
  return state[clubId];
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

const buildUploadResponse = (url) => ({
  data: {
    preview: {
      large: url,
    },
    variants: {
      large: url,
    },
    url,
  },
});

const brandingMockService = {
  getClubById: async (clubId) => {
    const club = getClubState(clubId);
    return {
      data: {
        club,
      },
    };
  },

  updateClubProfile: async (clubId, profileData = {}) => {
    const updatedClub = updateClubState(clubId, (current) => ({
      ...current,
      name: typeof profileData.name === "string" ? profileData.name : current.name,
    }));

    return {
      data: {
        club: updatedClub,
      },
    };
  },

  replaceClubBadge: async (clubId, file) => {
    const url = await fileToDataUrl(file);
    updateClubState(clubId, (current) => ({
      ...current,
      settings: {
        ...current.settings,
        branding: {
          ...current.settings?.branding,
          badgeUrl: url,
        },
      },
    }));
    return buildUploadResponse(url);
  },

  uploadClubImage: async (clubId, file, type) => {
    const url = await fileToDataUrl(file);
    const normalizedType = String(type || "").toLowerCase();
    updateClubState(clubId, (current) => {
      const isBadge = normalizedType === "badge";
      const isHero = ["hero", "header", "banner", "home"].includes(normalizedType);
      return {
        ...current,
        settings: {
          ...current.settings,
          branding: {
            ...current.settings?.branding,
            ...(isBadge ? { badgeUrl: url } : {}),
            ...(isHero ? { heroImageUrl: url } : {}),
          },
        },
      };
    });
    return buildUploadResponse(url);
  },
};

export default brandingMockService;
