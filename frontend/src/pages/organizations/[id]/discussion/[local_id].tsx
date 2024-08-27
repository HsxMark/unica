import {
  Grid,
  GridItem,
  Heading,
  IconButton,
  Button,
  Text,
  VStack,
  Box,
  useDisclosure,
  HStack,
  Spinner,
  Flex,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import Head from "next/head";
import React, { useContext, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaReply } from "react-icons/fa";
import { LuArrowUpToLine } from "react-icons/lu";
import { FiShare2 } from "react-icons/fi";
import NewDiscussionDrawer from "@/components/new-discussion-drawer";
import CommentList from "@/components/comment-list";
import OrganizationContext from "@/contexts/organization";
import { useToast } from "@/contexts/toast";
import { DiscussionComment, DiscussionTopic } from "@/models/discussion";
import {
  getTopicInfo,
  deleteTopic,
  createComment,
  listComments,
  deleteComment,
  editComment
} from "@/services/discussion";
import { shareContent } from "@/utils/share";
import InfiniteScroll from "react-infinite-scroller";

const DiscussionTopicPage = () => {
  const router = useRouter();
  const org_id = Number(router.query.id);
  const topic_local_id = Number(router.query.local_id);
  const { t } = useTranslation();
  const orgCtx = useContext(OrganizationContext);
  const toast = useToast();

  const [topic, setTopic] = useState<DiscussionTopic | null>(null);
  const [comments, setComments] = useState<DiscussionComment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTitleVisible, setIsTitleVisible] = useState(true);
  const titleRef = useRef(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsTitleVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (titleRef.current) {
      observer.observe(titleRef.current);
    }
    return () => {
      if (titleRef.current) {
        observer.unobserve(titleRef.current);
      }
    };
  }, []);

  const breadcrumbs = [
    {
      text: orgCtx.basicInfo?.display_name,
      link: `/organizations/${org_id}/discussion/`,
    },
  ];

  useEffect(() => {
    if (topic) {
      const metaTitle = isTitleVisible
        ? orgCtx.basicInfo?.display_name
        : topic.title;
      const metaBreadcrumbs = isTitleVisible
        ? JSON.stringify("")
        : JSON.stringify(breadcrumbs);
      document
        .querySelector('meta[name="headerTitle"]')
        .setAttribute("content", metaTitle);
      document
        .querySelector('meta[name="headerBreadcrumbs"]')
        .setAttribute("content", metaBreadcrumbs);
    }
  }, [isTitleVisible, topic]);

  useEffect(() => {
    getTopic();
    initializeComments();
  }, []);

  const initializeComments = async () => {
    setIsLoading(true);
    const res = await getCommentsList(1, pageSize);
    setComments(res.results);
    setIsLoading(false);
  };

  const getTopic = async () => {
    try {
      const res = await getTopicInfo(org_id, topic_local_id);
      setTopic(res);
    } catch (error) {
      console.error("Failed to get topic info:", error);
      if (error.request && error.request.status === 403) {
        orgCtx.toastNoPermissionAndRedirect();
      } else {
        toast({
          title: t("Services.discussion.getTopicInfo.error"),
          status: "error",
        });
      }
      setTopic(null);
      router.push(`/organizations/${org_id}/discussion/`);
    }
  };

  const getCommentsList = async (page: number = 1, pageSize: number = 20) => {
    try {
      const res = await listComments(org_id, page, pageSize, topic_local_id);
      if (res.count <= page * pageSize) setHasMore(false);
      console.log("Comments list:", res);
      return res;
    } catch (error) {
      console.error("Failed to get comment list:", error);
      if (error.request && error.request.status === 403) {
        orgCtx.toastNoPermissionAndRedirect();
      } else {
        toast({
          title: t("Services.discussion.listComments.error"),
          status: "error",
        });
      }
      return {};
    }
  };

  const loadMoreComments = async () => {
    if (isLoading) return;
    setIsLoading(true);
    console.log("Load more comments");
    const res = await getCommentsList(page + 1, pageSize);
    setComments([...comments, ...res.results]);
    setPage(page + 1);
    setIsLoading(false);
  };

  const handleSubmission = async () => {
    try {
      await createComment(org_id, topic_local_id, newComment);
    } catch (error) {
      console.error("Failed to create comment:", error);
      if (error.request && error.request.status === 403) {
        orgCtx.toastNoPermissionAndRedirect();
      } else {
        toast({
          title: t("Services.discussion.createComment.error"),
          status: "error",
        });
      }
    }
    toast({
      title: t("Services.discussion.createComment.success"),
      status: "success",
    });
    setNewComment("");
    onClose();
    
    // TODO: Operations after submission
  };

  const handleTopicDelete = async () => {
    try {
      await deleteTopic(org_id, topic_local_id);
    } catch (error) {
      console.error("Failed to delete topic:", error);
      if (error.request && error.request.status === 403) {
        orgCtx.toastNoPermissionAndRedirect();
      } else {
        toast({
          title: t("Services.discussion.deleteTopic.error"),
          status: "error",
        });
      }
    }
    toast({
      title: t("Services.discussion.deleteTopic.success"),
      status: "success",
    });
    router.push(`/organizations/${org_id}/discussion/`);
  };

  const handleCommentDelete = async (comment: DiscussionComment) => {
    try {
      await deleteComment(org_id, topic_local_id, comment.local_id);
      toast({
        title: t("Services.discussion.deleteComment.success"),
        status: "success",
      });
    } catch (error) {
      console.error("Failed to delete comment:", error);
      if (error.request && error.request.status === 403) {
        orgCtx.toastNoPermissionAndRedirect();
      } else {
        toast({
          title: t("Services.discussion.deleteComment.error"),
          status: "error",
        });
      }
    }
    if (hasMore) {
      const res = await getCommentsList(page, pageSize);
      setComments([...comments.filter((c) => c.local_id !== comment.local_id), res.results[res.results.length - 1]]);
    }
    else
      setComments(comments.filter((c) => c.local_id !== comment.local_id));
  };

  const handleCommentEdit = async (
    comment: DiscussionComment,
    newContent: string
  ) => {
    if (newContent === comment.content) return;
    try {
      await editComment(org_id, topic_local_id, comment.local_id, newContent);
      toast({
        title: t("Services.discussion.editComment.success"),
        status: "success",
      });
    } catch (error) {
      console.error("Failed to edit comment:", error);
      if (error.request && error.request.status === 403) {
        orgCtx.toastNoPermissionAndRedirect();
      } else {
        toast({
          title: t("Services.discussion.editComment.error"),
          status: "error",
        });
      }
    }
    setComments(
      comments.map((c) =>
        c.local_id === comment.local_id ? { ...c, content: newContent } : c
      )
    );
  };

  return (
    <>
      <Head>
        <meta name="headerTitle" content={orgCtx.basicInfo?.display_name} />
        <meta name="headerBreadcrumbs" content="" />
      </Head>
      <Box overflow='auto' height='80vh' id='scrollableDiv'>
        <Grid templateColumns="repeat(4, 1fr)" gap={16}>
          <GridItem colSpan={{ base: 4, md: 3 }}>
            <VStack spacing={6} align="stretch">
              <Skeleton isLoaded={topic !== null}>
                <Heading as="h3" size="lg" wordBreak="break-all" ref={titleRef} px={1}>
                  {topic?.title}
                  <Text
                    as="span"
                    fontWeight="normal"
                    color="gray.400"
                    ml={2}
                  >{`#${topic?.local_id}`}</Text>
                </Heading>
              </Skeleton>
              {comments && comments.length > 0 ? (
                <InfiniteScroll
                  loadMore={loadMoreComments}
                  hasMore={hasMore}
                  useWindow={false}
                  initialLoad={false}
                  getScrollParent={() => document.getElementById('scrollableDiv')}
                  loader={
                    <HStack justifyContent='center' mt='5'>
                      <Spinner
                        thickness="4px"
                        speed="0.65s"
                        emptyColor="gray.200"
                        color="blue.500"
                        size="lg"
                      />
                      <Text>{t("DiscussionTopicPage.loading")}</Text>
                    </HStack>}
                >
                  <CommentList
                    items={comments}
                    onCommentDelete={handleCommentDelete}
                    onCommentEdit={handleCommentEdit}
                    onTopicDelete={handleTopicDelete}
                    topic_op={topic?.user}
                  />
                </InfiniteScroll>
              ) : (
                <Flex justify="space-between" alignItems="flex-start">
                  <SkeletonCircle size="10" />
                  <SkeletonText
                    ml={{ base: "2", md: "4" }}
                    noOfLines={4}
                    spacing="4"
                    skeletonHeight="4"
                    flex="1"
                  />
                </Flex>
              )}
              <HStack spacing={2}>
                <Button
                  colorScheme="blue"
                  leftIcon={<FaReply />}
                  onClick={() => {
                    onOpen();
                  }}
                >
                  {t("DiscussionTopicPage.button.reply")}
                </Button>
                <Button
                  leftIcon={<FiShare2 />}
                  onClick={() => {
                    shareContent(
                      topic.title,
                      `Discussion on ${orgCtx.basicInfo?.display_name} #${topic.local_id}`,
                      window.location.href,
                      toast, t
                    )
                  }}
                >
                  {t("DiscussionTopicPage.button.share")}
                </Button>
              </HStack>
            </VStack>
          </GridItem>
          <GridItem
            colSpan={{ base: 0, md: 1 }}
            display={{ base: "none", md: "block" }}
          >
            <Box position="sticky" top="2">
              <HStack spacing={2}>
                <IconButton
                  aria-label="Add Comment"
                  icon={<FaReply />}
                  onClick={() => {
                    onOpen();
                  }}
                />
                <IconButton
                  aria-label="Scroll to Top"
                  icon={<LuArrowUpToLine />}
                  onClick={() => {
                    titleRef.current.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              </HStack>
            </Box>
          </GridItem>
        </Grid>
      </Box>

      <NewDiscussionDrawer
        isOpen={isOpen}
        onClose={onClose}
        drawerTitle={t("DiscussionTopicPage.drawer.reply")}
        variant="comment"
        comment={newComment}
        setComment={(comment) => setNewComment(comment)}
        onOKCallback={handleSubmission}
      >
        <React.Fragment />
      </NewDiscussionDrawer>
    </>
  );
};

export default DiscussionTopicPage;
