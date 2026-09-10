// “马”在棋盘上的概率
// https://leetcode.cn/problems/knight-probability-in-chessboard/
//
// 思路：dp[r][c] 表示当前步数下马在 (r, c) 的概率，每步把概率按 1/8
//       分摊给棋盘内的 8 个落点，K 步之后所有格子的概率之和就是答案。
// 复杂度：时间 O(K * N^2) 空间 O(N^2)
#include <iomanip>
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int N = 0, K = 0, sr = 0, sc = 0;
    if (!(cin >> N >> K >> sr >> sc)) return 0;

    const int dr[8] = {2, 2, 1, 1, -1, -1, -2, -2};
    const int dc[8] = {1, -1, 2, -2, 2, -2, 1, -1};

    vector<vector<double>> dp(N, vector<double>(N, 0.0));
    dp[sr][sc] = 1.0;

    for (int step = 0; step < K; ++step) {
        vector<vector<double>> next(N, vector<double>(N, 0.0));
        for (int r = 0; r < N; ++r) {
            for (int c = 0; c < N; ++c) {
                if (dp[r][c] <= 0.0) continue;
                for (int k = 0; k < 8; ++k) {
                    int nr = r + dr[k];
                    int nc = c + dc[k];
                    if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
                        next[nr][nc] += dp[r][c] / 8.0;
                    }
                }
            }
        }
        dp.swap(next);
    }

    double ans = 0.0;
    for (int r = 0; r < N; ++r) {
        for (int c = 0; c < N; ++c) ans += dp[r][c];
    }

    cout << fixed << setprecision(5) << ans << '\n';
    return 0;
}
