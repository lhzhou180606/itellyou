import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useDispatch, useSelector, Helmet } from 'umi';
import { RouteContext } from '@/context';
import Container, { Layout } from '@/components/Container';
import Loading from '@/components/Loading';
import { Article } from '@/components/Content';
import { Card, Space } from 'antd';
import Editor from '@/components/Editor';
import { GoogleHorizontal } from '@/components/AdSense';
import { HistoryButton } from '@/components/Button';
import HistoryExtra from '../components/HistoryExtra';
import Related from './Related';
import styles from './index.less';

function Detail({ match: { params } }) {
    const id = parseInt(params.id || 0);

    const [contentData, setContentData] = useState({});
    const [historyViewer, setHistoryViewer] = useState(false);

    const { detail } = useSelector(state => state.article);
    const settings = useSelector(state => state.settings);
    const { isMobile } = useContext(RouteContext);
    const loadingState = useSelector(state => state.loading);
    const loading = loadingState.effects['article/find'];

    const renderAction = useCallback(() => {
        if (!isMobile && !detail.paid_read)
            return <HistoryButton onClick={() => setHistoryViewer(true)} />;
        return null;
    }, [isMobile, detail]);

    if (!detail || loading) return <Loading />;

    const onContentReady = (view, config) => {
        setContentData({
            view,
            config,
        });
    };
    const { title, tags, author, description } = detail;
    const keywords = tags.map(tag => tag.name) || [];
    keywords.push('itellyou');

    return (
        <>
            <Helmet>
                <title>{`${title} - ${settings.title}`}</title>
                <meta name="author" content={author.name} />
                <meta name="keywords" content={keywords.join(',')} />
                <meta name="description" content={description} />
            </Helmet>
            <Container>
                <Layout>
                    <Space direction="vertical" size="large">
                        <div className={styles['article-view']}>
                            <Card>
                                <Article
                                    className={styles['article']}
                                    data={{ ...detail, cover: null }}
                                    tag={true}
                                    view={true}
                                    defaultComment={true}
                                    headerClass={styles['header']}
                                    titleClass={styles['title']}
                                    onContentReady={onContentReady}
                                    renderAction={renderAction}
                                />
                            </Card>
                        </div>
                        <GoogleHorizontal />
                        <Related id={id} />
                        {historyViewer && (
                            <Editor.History
                                id={id}
                                type="article"
                                extra={data => <HistoryExtra {...data} />}
                                onCancel={() => setHistoryViewer(false)}
                            />
                        )}
                    </Space>
                    <React.Fragment>
                        <Editor.Outline
                            {...contentData}
                            style={{ width: (1056 * 29.16666667) / 100 - 22 }}
                        />
                    </React.Fragment>
                </Layout>
            </Container>
        </>
    );
}

Detail.getInitialProps = async ({ isServer, match, store, params }) => {
    const { dispatch, getState } = store;
    const id = parseInt(match.params.id || 0);
    await dispatch({
        type: 'article/view',
        payload: {
            id,
            ...params,
        },
    });
    await dispatch({
        type: 'article/find',
        payload: {
            id,
            ...params,
        },
    });
    await dispatch({
        type: 'articleComment/root',
        payload: {
            articleId: id,
            offset: 0,
            limit: 20,
            ...params,
        },
    });
    await dispatch({
        type: 'articleReward/list',
        payload: {
            id,
            append: false,
            limit: 99999,
            ...params,
        },
    });
    await dispatch({
        type: 'article/related',
        payload: {
            offset: 0,
            limit: 10,
            id,
            ...params,
        },
    });
    if (isServer) return getState();
};
export default Detail;
