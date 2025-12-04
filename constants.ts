import { ModelOption, PoseOption, SettingOption, StyleOption } from './types';

// Using high-quality Unsplash images for a premium look
const getUnsplashUrl = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=300&q=80`;

export const MODELS: ModelOption[] = [
  {
    id: 'model_f_1',
    name: 'Sofia',
    type: 'model',
    gender: 'female',
    thumbnail: getUnsplashUrl('1534528741775-53994a69daeb'), // Woman portrait
    description: 'Studio Model',
    promptFragment: 'a professional female fashion model with light skin tone and neutral expression'
  },
  {
    id: 'model_f_2',
    name: 'Chloe',
    type: 'model',
    gender: 'female',
    thumbnail: getUnsplashUrl('1524504388940-b1c1722653e1'), // Fashion model
    description: 'Editorial Model',
    promptFragment: 'a high-fashion female model with distinctive features and confident gaze'
  },
  {
    id: 'model_m_1',
    name: 'Marcus',
    type: 'model',
    gender: 'male',
    thumbnail: getUnsplashUrl('1506794778202-cad84cf45f1d'), // Man portrait
    description: 'Athletic Model',
    promptFragment: 'a professional male fashion model with athletic build and confident gaze'
  },
  {
    id: 'model_m_2',
    name: 'David',
    type: 'model',
    gender: 'male',
    thumbnail: getUnsplashUrl('1500648767791-00dcc994a43e'), // Man portrait smiling
    description: 'Casual Model',
    promptFragment: 'a relaxed male model with a friendly expression and casual stance'
  },
  {
    id: 'obj_hanger_1',
    name: 'Hanger',
    type: 'object',
    thumbnail: getUnsplashUrl('1517705008128-16196a296a18'), // Clothes rack
    description: 'Minimalist Display',
    promptFragment: 'hanging on a high-quality wooden hanger'
  },
  {
    id: 'obj_desk_1',
    name: 'Flat Lay',
    type: 'object',
    thumbnail: getUnsplashUrl('1493723843689-d988e3659496'), // Flat lay
    description: 'Surface Fold',
    promptFragment: 'neatly folded and placed on a flat surface'
  }
];

export const POSES: PoseOption[] = [
  {
    id: 'pose_stand_front',
    name: 'Standing',
    allowedModes: ['model'],
    thumbnail: getUnsplashUrl('1515886657613-9f3515b0c78f'), // Full body fashion
    description: 'Front facing.',
    promptFragment: 'standing facing the camera, hands relaxed by sides, symmetrical pose'
  },
  {
    id: 'pose_walking',
    name: 'Walking',
    allowedModes: ['model'],
    thumbnail: getUnsplashUrl('1469334031218-e382a71b716b'), // Walking fashion
    description: 'Dynamic motion.',
    promptFragment: 'walking towards the camera, dynamic movement in fabric, one leg forward'
  },
  {
    id: 'pose_sitting',
    name: 'Sitting',
    allowedModes: ['model'],
    thumbnail: getUnsplashUrl('1534030347209-7147fd69a398'), // Sitting
    description: 'Relaxed stool.',
    promptFragment: 'sitting casually on a minimal stool, one leg crossed, relaxed posture'
  },
  {
    id: 'pose_side',
    name: 'Profile',
    allowedModes: ['model'],
    thumbnail: getUnsplashUrl('1502323777036-f29e3972d82f'), // Side profile
    description: 'Side view.',
    promptFragment: 'standing in side profile view, highlighting the silhouette'
  },
  {
    id: 'pose_flat_straight',
    name: 'Symmetrical',
    allowedModes: ['object'],
    thumbnail: getUnsplashUrl('1550614000-4b9519e02a15'), // Neatly folded
    description: 'Perfectly aligned.',
    promptFragment: 'arranged in a perfectly symmetrical flat lay, showing full garment shape'
  },
  {
    id: 'pose_wrinkled_art',
    name: 'Artistic',
    allowedModes: ['object'],
    thumbnail: getUnsplashUrl('1489987707025-afc232f7ea0f'), // Fabric texture
    description: 'Natural folds.',
    promptFragment: 'arranged with artistic natural folds and wrinkles for texture'
  }
];

export const SETTINGS: SettingOption[] = [
  {
    id: 'set_studio_white',
    name: 'Pure Studio',
    category: 'studio',
    thumbnail: getUnsplashUrl('1581850518616-bcb8077a2336'), // White abstract
    description: 'Infinity white.',
    promptFragment: 'in a professional photography studio with an infinity white background and soft high-key lighting'
  },
  {
    id: 'set_urban',
    name: 'Urban Street',
    category: 'outdoor',
    thumbnail: getUnsplashUrl('1449824913935-59a10b8d2000'), // City street
    description: 'Blurred city.',
    promptFragment: 'on a busy city street with blurred urban architecture in the background, natural daylight'
  },
  {
    id: 'set_nature',
    name: 'Golden Hour',
    category: 'outdoor',
    thumbnail: getUnsplashUrl('1470252649378-9c29740c9fa8'), // Nature field
    description: 'Warm field.',
    promptFragment: 'in a natural field during golden hour with warm sun flares and organic background'
  },
  {
    id: 'set_ind_loft',
    name: 'Industrial',
    category: 'indoor',
    thumbnail: getUnsplashUrl('1505691938895-1cd1027d1a58'), // Loft
    description: 'Concrete loft.',
    promptFragment: 'inside a modern industrial loft with concrete walls and window shadows'
  }
];

export const STYLES: StyleOption[] = [
  {
    id: 'style_commercial',
    name: 'E-Commerce',
    intensity: 'natural',
    thumbnail: getUnsplashUrl('1441986300917-64674bd600d8'), // Store/Clean
    description: 'Clean & Sharp.',
    promptFragment: 'shot with a 85mm lens, f/8 aperture, extremely sharp details, 4k commercial product photography, true color'
  },
  {
    id: 'style_editorial',
    name: 'Editorial',
    intensity: 'cinematic',
    thumbnail: getUnsplashUrl('1496747611176-843222e1e57c'), // Fashion editorial
    description: 'Moody & Bold.',
    promptFragment: 'cinematic editorial fashion photography, dramatic contrast, moody atmosphere, color graded, film grain'
  },
  {
    id: 'style_minimal',
    name: 'Minimal',
    intensity: 'minimalist',
    thumbnail: getUnsplashUrl('1494438639946-1ebd1d20bf85'), // Minimalist
    description: 'Soft & Pastel.',
    promptFragment: 'minimalist aesthetic, soft pastel color palette, low contrast, dreamy atmosphere'
  }
];