import type { ImageSourcePropType } from "react-native";
import { profilePhotos } from "./images";

export type CoupleStory = {
  id: string;
  names: string;
  photo: ImageSourcePropType;
};

export const coupleStories: CoupleStory[] = [
  { id: "c1", names: "Monalisa and Nigam", photo: profilePhotos.couple1 },
  { id: "c2", names: "Jinita and Abhishek", photo: profilePhotos.couple2 },
  { id: "c3", names: "Mitali and Raj", photo: profilePhotos.couple3 },
  { id: "c4", names: "Priya and Karan", photo: profilePhotos.couple4 },
];
