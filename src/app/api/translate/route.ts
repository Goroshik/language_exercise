import {NextRequest, NextResponse} from 'next/server';
import {userTokenRepository} from 'src/repository/client';
import {getUserIdFromRequest, createUnauthorizedResponse} from 'src/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const {userId, error} = getUserIdFromRequest(request);
    if (error) return createUnauthorizedResponse(error);

    const {word} = await request.json();
    if (!word || typeof word !== 'string' || word.trim().split(/\s+/).length > 1) {
      return NextResponse.json({error: 'Можно переводить только одно слово'}, {status: 400});
    }

    // Получаем токен DeepL из БД
    const tokens = await userTokenRepository.findByUser(userId);
    const deeplTokenObj = tokens.find(t => t.service === 'deepl');
    if (!deeplTokenObj?.token) {
      return NextResponse.json({error: 'Токен DeepL не найден'}, {status: 401});
    }

    // Запрос к DeepL API
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `DeepL-Auth-Key ${deeplTokenObj.token}`
      },
      body: new URLSearchParams({
        text: word,
        target_lang: 'RU',
        source_lang: 'EN'
      }).toString()
    });
    const data = await response.json();
    if (data.translations && data.translations[0]?.text) {
      return NextResponse.json({text: data.translations[0].text});
    }
    return NextResponse.json({error: data.message || 'Ошибка перевода'}, {status: 500});
  } catch (err: any) {
    return NextResponse.json({error: err?.message || 'Ошибка сервера'}, {status: 500});
  }
}

