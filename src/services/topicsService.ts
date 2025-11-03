import topics_eng from 'src/constants/topics_eng';
import topics_pl from 'src/constants/topics_pl';

export function getTopicsService(language: string = 'en') {
  switch (language) {
    case 'pl':
      return topics_pl;
    case 'en':
    default:
      return topics_eng;
  }
}
