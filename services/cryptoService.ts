
// 이 파일은 외장 API 키 관리 시스템(window.aistudio) 도입으로 인해 더 이상 사용되지 않습니다.
// 모든 키 관리는 플랫폼 레벨에서 안전하게 처리됩니다.
export const clearOldStorage = () => {
  localStorage.removeItem('gemini_api_key_secure');
};
