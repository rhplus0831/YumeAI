# YumeAI
Yume(夢) like Ai(愛) with Your AI

## 개발 방향성 아무거나 메모
- 너무 많은 내용은 모델에게 부담을 줄 수 있다는 추측(* 애초에 인간도 대화가 길어지면 이전 내용을 잘 기억하기 힘들다는 사실)을 기반으로, 대화 기반으로 주기적 요약을 실시하고 이를 제공
  - 요약을 좀 더 공격적으로 활용하는 만큼, 키워드 추출이나 벡터 기반 사용도 고려해보기
- 합당하다면 클라이언트가 아니라 서버의 프로세싱 자원을 더 사용
- 데이터의 보존이 중요한 만큼, 다소 공격적인 백업 주기와 안전한 백업 방법을 확보하기
- (물론 지금도 싼건 아니지만) 모델들이 전체적으로 저렴해졌으므로, 요청이 여러개가 되더라도 좀 더 괜찮은 응답을 얻기